import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Entregador,
  EntregadorStatus,
  Entrega,
  Pedido,
  RegiaoEntrega,
  Caixa,
} from '../types';
import { generateSafeId } from '../utils/formatters';
import { registrarLogAuditoria } from './authService';
import { atualizarStatusPedido } from './pedidosService';

export async function criarRegiaoEntrega(dados: {
  nome: string;
  taxa: number;
  tempoEstimadoMin?: number;
  ativo: boolean;
}): Promise<string> {
  const id = generateSafeId('reg');
  const path = `regioesEntrega/${id}`;
  try {
    const payload: Record<string, unknown> = {
      nome: dados.nome.trim().slice(0, 100),
      taxa: Math.max(0, Number(dados.taxa) || 0),
      ativo: Boolean(dados.ativo),
      criadoEm: new Date().toISOString(),
    };
    if (dados.tempoEstimadoMin) {
      payload.tempoEstimadoMin = Math.max(1, Number(dados.tempoEstimadoMin));
    }
    await setDoc(doc(db, 'regioesEntrega', id), payload);
    await registrarLogAuditoria(
      'Região de Entrega',
      `Região "${dados.nome}" cadastrada com taxa R$ ${Number(dados.taxa).toFixed(2)}`
    );
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function atualizarRegiaoEntrega(
  id: string,
  dados: Partial<Omit<RegiaoEntrega, 'id' | 'criadoEm'>>
): Promise<void> {
  const path = `regioesEntrega/${id}`;
  try {
    const updateData: Record<string, unknown> = {};
    if (dados.nome !== undefined) updateData.nome = dados.nome.trim().slice(0, 100);
    if (dados.taxa !== undefined) updateData.taxa = Math.max(0, Number(dados.taxa) || 0);
    if (dados.tempoEstimadoMin !== undefined) {
      updateData.tempoEstimadoMin = Math.max(1, Number(dados.tempoEstimadoMin));
    }
    if (dados.ativo !== undefined) updateData.ativo = Boolean(dados.ativo);
    await updateDoc(doc(db, 'regioesEntrega', id), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function excluirRegiaoEntrega(id: string): Promise<void> {
  const path = `regioesEntrega/${id}`;
  try {
    await deleteDoc(doc(db, 'regioesEntrega', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function criarEntregador(dados: {
  nome: string;
  telefone: string;
  veiculo?: string;
  status?: EntregadorStatus;
}): Promise<string> {
  const id = generateSafeId('ent');
  const path = `entregadores/${id}`;
  try {
    const payload: Record<string, unknown> = {
      nome: dados.nome.trim().slice(0, 120),
      telefone: dados.telefone.trim().slice(0, 30),
      status: dados.status || 'disponivel',
      entregasRealizadas: 0,
      criadoEm: new Date().toISOString(),
    };
    if (dados.veiculo) {
      payload.veiculo = dados.veiculo.trim().slice(0, 80);
    }
    await setDoc(doc(db, 'entregadores', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function atualizarStatusEntregador(
  id: string,
  status: EntregadorStatus
): Promise<void> {
  const path = `entregadores/${id}`;
  try {
    await updateDoc(doc(db, 'entregadores', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function atribuirPedidoAoEntregador(
  pedido: Pedido,
  entregador: Entregador,
  despacharImediatamente = true
): Promise<void> {
  const entregaId = generateSafeId('deliv');
  const agora = new Date().toISOString();
  const novoStatusPedido = despacharImediatamente ? 'saiu_para_entrega' : pedido.status;

  try {
    await updateDoc(doc(db, 'pedidos', pedido.id), {
      entregadorId: entregador.id,
      entregadorNome: entregador.nome.slice(0, 120),
      status: novoStatusPedido,
      atualizadoEm: agora,
    });

    const entregaPayload: Record<string, unknown> = {
      pedidoId: pedido.id,
      numeroPedido: pedido.numero,
      entregadorId: entregador.id,
      entregadorNome: entregador.nome.slice(0, 120),
      clienteNome: pedido.clienteNome.slice(0, 120),
      endereco: (pedido.enderecoEntrega || 'Retirada / Balcão').slice(0, 250),
      status: despacharImediatamente ? 'saiu_para_entrega' : 'atribuida',
      valorTotalPedido: pedido.total,
      taxaEntrega: pedido.taxaEntrega || 0,
      formaPagamento: pedido.formaPagamento,
      atribuidoEm: agora,
    };
    if (pedido.clienteTelefone) {
      entregaPayload.clienteTelefone = pedido.clienteTelefone.slice(0, 30);
    }
    if (pedido.regiaoNome) {
      entregaPayload.regiaoNome = pedido.regiaoNome.slice(0, 100);
    }

    await setDoc(doc(db, 'entregas', entregaId), entregaPayload);

    await updateDoc(doc(db, 'entregadores', entregador.id), {
      status: 'em_entrega',
    });

    await registrarLogAuditoria(
      'Atribuição de Entrega',
      `Pedido #${pedido.numero} atribuído ao entregador ${entregador.nome}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `entregas/${entregaId}`);
  }
}

export async function concluirEntrega(
  entrega: Entrega,
  pedidoRelacionado?: Pedido,
  entregadorRelacionado?: Entregador,
  caixaAberto?: Caixa | null
): Promise<void> {
  const agora = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'entregas', entrega.id), {
      status: 'entregue',
      entregueEm: agora,
    });

    if (pedidoRelacionado) {
      await atualizarStatusPedido(pedidoRelacionado, 'entregue', caixaAberto);
    }

    if (entregadorRelacionado) {
      await updateDoc(doc(db, 'entregadores', entregadorRelacionado.id), {
        status: 'disponivel',
        entregasRealizadas: (entregadorRelacionado.entregasRealizadas || 0) + 1,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `entregas/${entrega.id}`);
  }
}
