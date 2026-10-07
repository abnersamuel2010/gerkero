import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { PedidoCozinha, StatusCozinha, Pedido } from '../types';
import { registrarLogAuditoria } from './authService';

export async function atualizarStatusCozinhaKDS(
  itemKds: PedidoCozinha,
  novoStatus: StatusCozinha,
  pedidosAtivos: Pedido[]
): Promise<void> {
  const path = `pedidosCozinha/${itemKds.id}`;
  const agora = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'pedidosCozinha', itemKds.id), {
      status: novoStatus,
      atualizadoEm: agora,
    });

    // Sincronizar automaticamente com o Pedido principal (Delivery / Marmita / Balcão)
    const pedidoRelacionado = pedidosAtivos.find((p) => p.id === itemKds.referenciaId);
    if (pedidoRelacionado) {
      let statusPedido: Pedido['status'] | null = null;
      if (novoStatus === 'em_preparo') {
        statusPedido = 'em_preparo';
      } else if (novoStatus === 'pronto') {
        statusPedido = 'pronto';
      }
      if (
        statusPedido &&
        pedidoRelacionado.status !== 'saiu_para_entrega' &&
        pedidoRelacionado.status !== 'entregue' &&
        pedidoRelacionado.status !== 'cancelado'
      ) {
        await updateDoc(doc(db, 'pedidos', pedidoRelacionado.id), {
          status: statusPedido,
          atualizadoEm: agora,
        });
      }
    }

    await registrarLogAuditoria(
      'KDS Cozinha',
      `Ordem #${itemKds.numero} (${itemKds.identificacao}) marcada como ${novoStatus.toUpperCase()}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
