import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Comanda,
  ItemComanda,
  Mesa,
  Produto,
  FormaPagamento,
  Caixa,
} from '../types';
import { generateSafeId } from '../utils/formatters';
import { gerarCodigoComanda, atualizarStatusMesa } from './mesasService';
import { registrarMovimentacaoCaixa } from './caixaService';
import { registrarLogAuditoria } from './authService';

export async function abrirComandaMesa(dados: {
  mesa: Mesa;
  pessoas: number;
  tipoBuffet?: string;
  valorPorPessoaBuffet?: number;
}): Promise<string> {
  const comandaId = generateSafeId('cmd');
  const agora = new Date().toISOString();
  const codigo = gerarCodigoComanda(dados.mesa.numero);
  const qtdPessoas = Math.max(1, Number(dados.pessoas) || 1);
  const valorUnitBuffet = Math.max(0, Number(dados.valorPorPessoaBuffet) || 0);
  const valorBuffetTotal = Number((qtdPessoas * valorUnitBuffet).toFixed(2));

  const path = `comandas/${comandaId}`;
  try {
    const payload: Record<string, unknown> = {
      codigo,
      mesaId: dados.mesa.id,
      mesaNumero: dados.mesa.numero,
      status: 'aberta',
      pessoas: qtdPessoas,
      tipoBuffet: (dados.tipoBuffet || 'Sem Buffet Fixo').slice(0, 60),
      valorPorPessoaBuffet: valorUnitBuffet,
      valorBuffetTotal,
      subtotalItens: 0,
      total: valorBuffetTotal,
      criadoPor: (auth.currentUser?.uid || 'atendente').slice(0, 128),
      criadoEm: agora,
      atualizadoEm: agora,
    };

    await setDoc(doc(db, 'comandas', comandaId), payload);
    await atualizarStatusMesa(dados.mesa, 'ocupada', qtdPessoas, comandaId, '');

    await registrarLogAuditoria(
      'Abertura de Comanda',
      `Comanda ${codigo} aberta na Mesa ${dados.mesa.numero} (${qtdPessoas} pessoas)`
    );
    return comandaId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function recalcularTotalComanda(
  comanda: Comanda,
  itensDaComanda: ItemComanda[],
  novoBuffetConfig?: {
    pessoas: number;
    tipoBuffet: string;
    valorPorPessoaBuffet: number;
  }
): Promise<void> {
  const path = `comandas/${comanda.id}`;
  const subtotalItens = Number(
    itensDaComanda.reduce((acc, item) => acc + item.total, 0).toFixed(2)
  );
  const pessoas = novoBuffetConfig
    ? Math.max(1, novoBuffetConfig.pessoas)
    : comanda.pessoas;
  const valorPorPessoaBuffet = novoBuffetConfig
    ? Math.max(0, novoBuffetConfig.valorPorPessoaBuffet)
    : comanda.valorPorPessoaBuffet || 0;
  const tipoBuffet = novoBuffetConfig
    ? novoBuffetConfig.tipoBuffet
    : comanda.tipoBuffet || 'Sem Buffet Fixo';

  const valorBuffetTotal = Number((pessoas * valorPorPessoaBuffet).toFixed(2));
  const total = Number((valorBuffetTotal + subtotalItens).toFixed(2));

  try {
    await updateDoc(doc(db, 'comandas', comanda.id), {
      pessoas,
      tipoBuffet: tipoBuffet.slice(0, 60),
      valorPorPessoaBuffet,
      valorBuffetTotal,
      subtotalItens,
      total,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adicionarItemComanda(dados: {
  comanda: Comanda;
  itensAtuais: ItemComanda[];
  produto: Produto;
  quantidade: number;
  observacao?: string;
  enviarCozinha?: boolean;
}): Promise<void> {
  const itemId = generateSafeId('icmd');
  const agora = new Date().toISOString();
  const qtd = Math.max(1, Number(dados.quantidade) || 1);
  const unit = Math.max(0, Number(dados.produto.preco) || 0);
  const totalItem = Number((qtd * unit).toFixed(2));

  try {
    const itemPayload: Record<string, unknown> = {
      comandaId: dados.comanda.id,
      mesaNumero: dados.comanda.mesaNumero,
      produtoId: dados.produto.id,
      produtoNome: dados.produto.nome.slice(0, 140),
      categoria: dados.produto.categoria.slice(0, 60),
      quantidade: qtd,
      valorUnitario: unit,
      total: totalItem,
      criadoEm: agora,
    };
    if (dados.observacao) {
      itemPayload.observacao = dados.observacao.trim().slice(0, 240);
    }

    await setDoc(doc(db, 'itensComanda', itemId), itemPayload);

    const novaLista: ItemComanda[] = [
      ...dados.itensAtuais,
      {
        id: itemId,
        comandaId: dados.comanda.id,
        mesaNumero: dados.comanda.mesaNumero,
        produtoId: dados.produto.id,
        produtoNome: dados.produto.nome,
        categoria: dados.produto.categoria,
        quantidade: qtd,
        valorUnitario: unit,
        total: totalItem,
        observacao: dados.observacao,
        criadoEm: agora,
      },
    ];

    await recalcularTotalComanda(dados.comanda, novaLista);

    // Se precisa de preparo na cozinha, envia automaticamente para pedidosCozinha
    const precisaCozinha =
      dados.enviarCozinha ??
      ['Marmitas', 'Carnes', 'Carnes Especiais', 'Porções', 'Acompanhamentos'].includes(
        dados.produto.categoria
      );

    if (precisaCozinha) {
      const kdsId = generateSafeId('kds');
      const kdsPayload: Record<string, unknown> = {
        referenciaId: dados.comanda.id,
        numero: dados.comanda.mesaNumero,
        origem: 'mesa',
        identificacao: `MESA ${dados.comanda.mesaNumero} (${dados.comanda.codigo})`.slice(0, 120),
        itensTexto: `${qtd}x ${dados.produto.nome}`.slice(0, 800),
        status: 'novo',
        criadoEm: agora,
        atualizadoEm: agora,
      };
      if (dados.observacao) {
        kdsPayload.observacoes = dados.observacao.trim().slice(0, 300);
      }
      await setDoc(doc(db, 'pedidosCozinha', kdsId), kdsPayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `itensComanda/${itemId}`);
  }
}

export async function alterarQuantidadeItemComanda(
  comanda: Comanda,
  item: ItemComanda,
  novaQuantidade: number,
  todosItensDaComanda: ItemComanda[]
): Promise<void> {
  if (novaQuantidade <= 0) {
    await removerItemComanda(comanda, item, todosItensDaComanda);
    return;
  }
  const novoTotal = Number((novaQuantidade * item.valorUnitario).toFixed(2));
  try {
    await updateDoc(doc(db, 'itensComanda', item.id), {
      quantidade: novaQuantidade,
      total: novoTotal,
    });
    const listaAtualizada = todosItensDaComanda.map((i) =>
      i.id === item.id ? { ...i, quantidade: novaQuantidade, total: novoTotal } : i
    );
    await recalcularTotalComanda(comanda, listaAtualizada);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `itensComanda/${item.id}`);
  }
}

export async function removerItemComanda(
  comanda: Comanda,
  item: ItemComanda,
  todosItensDaComanda: ItemComanda[]
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'itensComanda', item.id));
    const listaAtualizada = todosItensDaComanda.filter((i) => i.id !== item.id);
    await recalcularTotalComanda(comanda, listaAtualizada);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `itensComanda/${item.id}`);
  }
}

export async function transferirMesaComanda(
  comanda: Comanda,
  mesaOrigem: Mesa,
  mesaDestino: Mesa,
  itensDaComanda: ItemComanda[]
): Promise<void> {
  const agora = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'comandas', comanda.id), {
      mesaId: mesaDestino.id,
      mesaNumero: mesaDestino.numero,
      atualizadoEm: agora,
    });

    for (const item of itensDaComanda) {
      await updateDoc(doc(db, 'itensComanda', item.id), {
        mesaNumero: mesaDestino.numero,
      });
    }

    await atualizarStatusMesa(mesaOrigem, 'livre', 0, '', '');
    await atualizarStatusMesa(
      mesaDestino,
      'ocupada',
      comanda.pessoas,
      comanda.id,
      ''
    );

    await registrarLogAuditoria(
      'Transferência de Mesa',
      `Comanda ${comanda.codigo} transferida da Mesa ${mesaOrigem.numero} para a Mesa ${mesaDestino.numero}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `comandas/${comanda.id}`);
  }
}

export async function transferirItemEntreComandas(
  item: ItemComanda,
  comandaOrigem: Comanda,
  itensOrigem: ItemComanda[],
  comandaDestino: Comanda,
  itensDestino: ItemComanda[]
): Promise<void> {
  try {
    await updateDoc(doc(db, 'itensComanda', item.id), {
      comandaId: comandaDestino.id,
      mesaNumero: comandaDestino.mesaNumero,
    });

    const novaListaOrigem = itensOrigem.filter((i) => i.id !== item.id);
    const novaListaDestino = [
      ...itensDestino,
      { ...item, comandaId: comandaDestino.id, mesaNumero: comandaDestino.mesaNumero },
    ];

    await recalcularTotalComanda(comandaOrigem, novaListaOrigem);
    await recalcularTotalComanda(comandaDestino, novaListaDestino);

    await registrarLogAuditoria(
      'Transferência de Item',
      `Item "${item.produtoNome}" transferido da Mesa ${comandaOrigem.mesaNumero} para Mesa ${comandaDestino.mesaNumero}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `itensComanda/${item.id}`);
  }
}

export async function fecharComandaEPagar(
  comanda: Comanda,
  mesaRelacionada: Mesa | undefined,
  formaPagamento: FormaPagamento,
  caixaAberto?: Caixa | null,
  troco = 0
): Promise<void> {
  const agora = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'comandas', comanda.id), {
      status: 'fechada',
      atualizadoEm: agora,
    });

    if (mesaRelacionada) {
      await atualizarStatusMesa(mesaRelacionada, 'livre', 0, '', '');
    }

    if (caixaAberto) {
      await registrarMovimentacaoCaixa(
        caixaAberto,
        'venda',
        formaPagamento,
        comanda.total,
        `Fechamento Comanda ${comanda.codigo} (Mesa ${comanda.mesaNumero})`,
        comanda.id,
        'comanda',
        troco
      );
    } else {
      const pagId = generateSafeId('pag');
      await setDoc(doc(db, 'pagamentos', pagId), {
        referenciaId: comanda.id,
        tipoReferencia: 'comanda',
        formaPagamento,
        valor: comanda.total,
        registradoPor: (auth.currentUser?.displayName || 'Caixa').slice(0, 120),
        criadoEm: agora,
      });
    }

    await registrarLogAuditoria(
      'Fechamento de Comanda',
      `Comanda ${comanda.codigo} (Mesa ${comanda.mesaNumero}) fechada por R$ ${comanda.total.toFixed(2)} via ${formaPagamento}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `comandas/${comanda.id}`);
  }
}
