import { doc, setDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Pedido,
  PedidoOrigem,
  PedidoStatus,
  FormaPagamento,
  Caixa,
} from '../types';
import { generateSafeId } from '../utils/formatters';
import { registrarLogAuditoria } from './authService';
import { registrarMovimentacaoCaixa } from './caixaService';

export interface NovoItemPedidoInput {
  tipo: 'marmita' | 'produto' | 'buffet';
  nome: string;
  tamanhoMarmita?: string;
  carnes?: string;
  acompanhamentos?: string;
  adicionais?: string;
  bebidas?: string;
  quantidade: number;
  valorUnitario: number;
  observacao?: string;
}

export async function criarPedidoCompleto(dados: {
  numero: number;
  origem: PedidoOrigem;
  clienteNome: string;
  clienteTelefone?: string;
  enderecoEntrega?: string;
  regiaoId?: string;
  regiaoNome?: string;
  taxaEntrega?: number;
  formaPagamento: FormaPagamento;
  trocoPara?: number;
  observacoes?: string;
  itens: NovoItemPedidoInput[];
  enviarParaCozinha?: boolean;
  registrarCliente?: boolean;
}): Promise<string> {
  const pedidoId = generateSafeId('ped');
  const agora = new Date().toISOString();
  const subtotal = dados.itens.reduce(
    (acc, item) => acc + item.quantidade * item.valorUnitario,
    0
  );
  const taxa = Math.max(0, Number(dados.taxaEntrega) || 0);
  const total = Number((subtotal + taxa).toFixed(2));
  const qtdMarmitas = dados.itens
    .filter((i) => i.tipo === 'marmita' || i.nome.toLowerCase().includes('marmita'))
    .reduce((acc, i) => acc + i.quantidade, 0);

  const resumoItens = dados.itens
    .map((i) => {
      const detalhes = [i.tamanhoMarmita, i.carnes, i.acompanhamentos, i.adicionais, i.bebidas]
        .filter(Boolean)
        .join(' + ');
      return `${i.quantidade}x ${i.nome}${detalhes ? ` (${detalhes})` : ''}`;
    })
    .join(' | ')
    .slice(0, 800);

  const path = `pedidos/${pedidoId}`;
  try {
    const pedidoPayload: Record<string, unknown> = {
      numero: dados.numero,
      origem: dados.origem,
      status: 'novo',
      clienteNome: (dados.clienteNome || 'Cliente Balcão').trim().slice(0, 120),
      formaPagamento: dados.formaPagamento,
      subtotal: Number(subtotal.toFixed(2)),
      total,
      resumoItens: resumoItens || '1x Item',
      qtdMarmitas,
      pago: false,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    if (dados.clienteTelefone) {
      pedidoPayload.clienteTelefone = dados.clienteTelefone.trim().slice(0, 30);
    }
    if (dados.enderecoEntrega) {
      pedidoPayload.enderecoEntrega = dados.enderecoEntrega.trim().slice(0, 250);
    }
    if (dados.regiaoId) {
      pedidoPayload.regiaoId = dados.regiaoId.trim().slice(0, 128);
    }
    if (dados.regiaoNome) {
      pedidoPayload.regiaoNome = dados.regiaoNome.trim().slice(0, 100);
    }
    if (taxa >= 0) {
      pedidoPayload.taxaEntrega = taxa;
    }
    if (dados.trocoPara && dados.trocoPara > 0) {
      pedidoPayload.trocoPara = Number(dados.trocoPara);
    }
    if (dados.observacoes) {
      pedidoPayload.observacoes = dados.observacoes.trim().slice(0, 300);
    }
    if (auth.currentUser?.uid) {
      pedidoPayload.criadoPor = auth.currentUser.uid.slice(0, 128);
    }

    await setDoc(doc(db, 'pedidos', pedidoId), pedidoPayload);

    // Salvar itens individuais na coleção itensPedido
    for (const item of dados.itens) {
      const itemId = generateSafeId('iped');
      const itemPayload: Record<string, unknown> = {
        pedidoId,
        numeroPedido: dados.numero,
        tipo: item.tipo,
        nome: item.nome.trim().slice(0, 160),
        quantidade: Math.max(1, item.quantidade),
        valorUnitario: Math.max(0, item.valorUnitario),
        total: Number((item.quantidade * item.valorUnitario).toFixed(2)),
        criadoEm: agora,
      };
      if (item.tamanhoMarmita) itemPayload.tamanhoMarmita = item.tamanhoMarmita.slice(0, 40);
      if (item.carnes) itemPayload.carnes = item.carnes.slice(0, 250);
      if (item.acompanhamentos) itemPayload.acompanhamentos = item.acompanhamentos.slice(0, 350);
      if (item.adicionais) itemPayload.adicionais = item.adicionais.slice(0, 250);
      if (item.bebidas) itemPayload.bebidas = item.bebidas.slice(0, 200);
      if (item.observacao) itemPayload.observacao = item.observacao.slice(0, 240);

      await setDoc(doc(db, 'itensPedido', itemId), itemPayload);
    }

    // Enviar automaticamente para a Cozinha (KDS)
    if (dados.enviarParaCozinha !== false) {
      const cozId = generateSafeId('kds');
      const kdsPayload: Record<string, unknown> = {
        referenciaId: pedidoId,
        numero: dados.numero,
        origem: dados.origem,
        identificacao: `${dados.origem.toUpperCase()} #${dados.numero} - ${dados.clienteNome}`.slice(0, 120),
        itensTexto: (resumoItens || 'Pedido').slice(0, 800),
        status: 'novo',
        criadoEm: agora,
        atualizadoEm: agora,
      };
      if (dados.observacoes) {
        kdsPayload.observacoes = dados.observacoes.trim().slice(0, 300);
      }
      await setDoc(doc(db, 'pedidosCozinha', cozId), kdsPayload);
    }

    // Se for delivery e tiver dados completos do cliente, salvar/atualizar em clientes
    if (dados.registrarCliente && dados.clienteTelefone && dados.enderecoEntrega) {
      const cliId = generateSafeId('cli');
      const cliPayload: Record<string, unknown> = {
        nome: dados.clienteNome.trim().slice(0, 120),
        telefone: dados.clienteTelefone.trim().slice(0, 30),
        endereco: dados.enderecoEntrega.trim().slice(0, 250),
        totalPedidos: 1,
        criadoEm: agora,
      };
      if (dados.regiaoId) cliPayload.regiaoId = dados.regiaoId.slice(0, 128);
      if (dados.regiaoNome) cliPayload.regiaoNome = dados.regiaoNome.slice(0, 100);
      await setDoc(doc(db, 'clientes', cliId), cliPayload);
    }

    await registrarLogAuditoria(
      'Criação de Pedido',
      `Pedido #${dados.numero} (${dados.origem}) criado para ${dados.clienteNome} no valor de R$ ${total.toFixed(2)}`
    );

    return pedidoId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function atualizarStatusPedido(
  pedido: Pedido,
  novoStatus: PedidoStatus,
  caixaAberto?: Caixa | null
): Promise<void> {
  const path = `pedidos/${pedido.id}`;
  const agora = new Date().toISOString();
  try {
    const updatePayload: Record<string, unknown> = {
      status: novoStatus,
      atualizadoEm: agora,
    };

    // Se foi entregue e ainda não estava pago, marca como pago e lança no caixa aberto
    if (novoStatus === 'entregue' && !pedido.pago) {
      updatePayload.pago = true;
      if (caixaAberto) {
        await registrarMovimentacaoCaixa(
          caixaAberto,
          'venda',
          pedido.formaPagamento,
          pedido.total,
          `Recebimento Pedido #${pedido.numero} (${pedido.origem.toUpperCase()} - ${pedido.clienteNome})`,
          pedido.id,
          'pedido',
          pedido.trocoPara && pedido.trocoPara > pedido.total
            ? Number((pedido.trocoPara - pedido.total).toFixed(2))
            : 0
        );
      } else {
        // Registra pagamento mesmo se o caixa não estiver aberto na sessão atual
        const pagId = generateSafeId('pag');
        await setDoc(doc(db, 'pagamentos', pagId), {
          referenciaId: pedido.id,
          tipoReferencia: 'pedido',
          formaPagamento: pedido.formaPagamento,
          valor: pedido.total,
          registradoPor: (auth.currentUser?.displayName || 'Sistema').slice(0, 120),
          criadoEm: agora,
        });
      }
    }

    await updateDoc(doc(db, 'pedidos', pedido.id), updatePayload);

    if (novoStatus === 'cancelado') {
      await registrarLogAuditoria(
        'Cancelamento de Pedido',
        `Pedido #${pedido.numero} (${pedido.clienteNome}) foi CANCELADO`
      );
    } else {
      await registrarLogAuditoria(
        'Alteração de Pedido',
        `Status do Pedido #${pedido.numero} alterado para ${novoStatus}`
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Exclui permanentemente um pedido do Cloud Firestore,
 * removendo também seus itens da cozinha (KDS), itensPedido e entregas vinculadas.
 */
export async function excluirPedidoDefinitivo(
  pedidoId: string,
  numeroPedido?: number
): Promise<void> {
  const path = `pedidos/${pedidoId}`;
  try {
    // 1. Excluir o documento principal do pedido
    await deleteDoc(doc(db, 'pedidos', pedidoId));

    // 2. Excluir itens associados em itensPedido
    try {
      const snapItens = await getDocs(collection(db, 'itensPedido'));
      for (const d of snapItens.docs) {
        const itemData = d.data();
        if (
          itemData.pedidoId === pedidoId ||
          (numeroPedido && itemData.numeroPedido === numeroPedido)
        ) {
          await deleteDoc(doc(db, 'itensPedido', d.id));
        }
      }
    } catch (err) {
      console.warn('Erro ao limpar itensPedido vinculados:', err);
    }

    // 3. Excluir ordem correspondente na Cozinha (KDS)
    try {
      const snapKds = await getDocs(collection(db, 'pedidosCozinha'));
      for (const d of snapKds.docs) {
        const kdsData = d.data();
        if (
          kdsData.referenciaId === pedidoId ||
          (numeroPedido && kdsData.numero === numeroPedido)
        ) {
          await deleteDoc(doc(db, 'pedidosCozinha', d.id));
        }
      }
    } catch (err) {
      console.warn('Erro ao limpar pedidosCozinha vinculados:', err);
    }

    // 4. Excluir entregas vinculadas
    try {
      const snapEnt = await getDocs(collection(db, 'entregas'));
      for (const d of snapEnt.docs) {
        const entData = d.data();
        if (
          entData.pedidoId === pedidoId ||
          (numeroPedido && entData.numeroPedido === numeroPedido)
        ) {
          await deleteDoc(doc(db, 'entregas', d.id));
        }
      }
    } catch (err) {
      console.warn('Erro ao limpar entregas vinculadas:', err);
    }

    await registrarLogAuditoria(
      'Exclusão de Pedido',
      `Pedido #${numeroPedido || pedidoId} excluído permanentemente do sistema.`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
