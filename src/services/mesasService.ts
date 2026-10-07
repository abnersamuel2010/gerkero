import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Mesa, MesaStatus } from '../types';
import { generateSafeId } from '../utils/formatters';
import { registrarLogAuditoria } from './authService';

export async function criarMesa(numero: number, capacidade = 4): Promise<string> {
  const id = `mesa_${numero}`;
  const path = `mesas/${id}`;
  try {
    await setDoc(doc(db, 'mesas', id), {
      numero: Math.max(1, Number(numero)),
      status: 'livre',
      capacidade: Math.max(1, Number(capacidade)),
      pessoas: 0,
      atualizadoEm: new Date().toISOString(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function atualizarStatusMesa(
  mesa: Mesa,
  status: MesaStatus,
  pessoas = 0,
  comandaId = '',
  clienteReserva = ''
): Promise<void> {
  const path = `mesas/${mesa.id}`;
  try {
    const updatePayload: Record<string, unknown> = {
      status,
      pessoas: Math.max(0, Number(pessoas)),
      comandaId: comandaId.slice(0, 128),
      clienteReserva: clienteReserva.slice(0, 120),
      atualizadoEm: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'mesas', mesa.id), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function excluirMesa(mesa: Mesa): Promise<void> {
  const path = `mesas/${mesa.id}`;
  try {
    await deleteDoc(doc(db, 'mesas', mesa.id));
    await registrarLogAuditoria('Exclusão de Mesa', `Mesa ${mesa.numero} removida`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function gerarCodigoComanda(mesaNumero: number): string {
  const sufixo = Math.floor(100 + Math.random() * 900);
  return `CMD-M${String(mesaNumero).padStart(2, '0')}-${sufixo}`;
}
