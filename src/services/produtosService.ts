import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase/config';
import { Produto, CategoriaNome } from '../types';
import { generateSafeId } from '../utils/formatters';
import { registrarLogAuditoria } from './authService';

export async function criarProduto(dados: {
  nome: string;
  categoria: CategoriaNome;
  descricao: string;
  preco: number;
  imagemUrl?: string;
  disponivel: boolean;
  ativo: boolean;
  estoque?: number;
  diasSemana?: string[];
  ehEspecial?: boolean;
  exigeSegundaCarne?: boolean;
  ehDadoDemonstracao?: boolean;
}): Promise<string> {
  const id = generateSafeId('prod');
  const path = `produtos/${id}`;
  try {
    const payload: Record<string, unknown> = {
      nome: dados.nome.trim().slice(0, 120),
      categoria: dados.categoria,
      descricao: (dados.descricao || 'Item preparado na hora').trim().slice(0, 400),
      preco: Math.max(0, Number(dados.preco) || 0),
      disponivel: Boolean(dados.disponivel),
      ativo: Boolean(dados.ativo),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    if (dados.imagemUrl) {
      payload.imagemUrl = dados.imagemUrl.trim().slice(0, 600);
    }
    if (dados.estoque !== undefined && dados.estoque !== null) {
      payload.estoque = Math.max(0, Number(dados.estoque) || 0);
    }
    if (Array.isArray(dados.diasSemana)) {
      payload.diasSemana = dados.diasSemana;
    }
    if (typeof dados.ehEspecial === 'boolean') {
      payload.ehEspecial = Boolean(dados.ehEspecial);
    }
    if (typeof dados.exigeSegundaCarne === 'boolean') {
      payload.exigeSegundaCarne = Boolean(dados.exigeSegundaCarne);
    }
    if (typeof dados.ehDadoDemonstracao === 'boolean') {
      payload.ehDadoDemonstracao = dados.ehDadoDemonstracao;
    }
    await setDoc(doc(db, 'produtos', id), payload);
    await registrarLogAuditoria(
      'Criação de Produto',
      `Produto "${dados.nome}" criado na categoria ${dados.categoria} por R$ ${dados.preco.toFixed(2)}`
    );
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function atualizarProduto(
  id: string,
  dados: Partial<Omit<Produto, 'id' | 'criadoEm'>>
): Promise<void> {
  const path = `produtos/${id}`;
  try {
    const updateData: Record<string, unknown> = {
      atualizadoEm: new Date().toISOString(),
    };
    if (dados.nome !== undefined) updateData.nome = dados.nome.trim().slice(0, 120);
    if (dados.categoria !== undefined) updateData.categoria = dados.categoria;
    if (dados.descricao !== undefined) updateData.descricao = dados.descricao.trim().slice(0, 400);
    if (dados.preco !== undefined) updateData.preco = Math.max(0, Number(dados.preco) || 0);
    if (dados.imagemUrl !== undefined) updateData.imagemUrl = dados.imagemUrl.trim().slice(0, 600);
    if (dados.disponivel !== undefined) updateData.disponivel = Boolean(dados.disponivel);
    if (dados.ativo !== undefined) updateData.ativo = Boolean(dados.ativo);
    if (dados.estoque !== undefined) updateData.estoque = Math.max(0, Number(dados.estoque) || 0);
    if (dados.diasSemana !== undefined) updateData.diasSemana = dados.diasSemana;
    if (dados.ehEspecial !== undefined) updateData.ehEspecial = Boolean(dados.ehEspecial);
    if (dados.exigeSegundaCarne !== undefined) updateData.exigeSegundaCarne = Boolean(dados.exigeSegundaCarne);

    await updateDoc(doc(db, 'produtos', id), updateData);
    await registrarLogAuditoria(
      'Alteração de Produto/Preço',
      `Produto ID ${id} atualizado (${Object.keys(updateData).join(', ')})`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function ajustarEstoqueProduto(
  id: string,
  estoqueAtual: number | undefined,
  delta: number
): Promise<void> {
  const novoEstoque = Math.max(0, (estoqueAtual ?? 0) + delta);
  await atualizarProduto(id, { estoque: novoEstoque });
}

export async function alternarDisponibilidadeProduto(
  produto: Produto
): Promise<void> {
  const novoStatus = !produto.disponivel;
  await atualizarProduto(produto.id, { disponivel: novoStatus });
  await registrarLogAuditoria(
    'Disponibilidade de Produto',
    `Produto "${produto.nome}" marcado como ${novoStatus ? 'DISPONÍVEL' : 'INDISPONÍVEL NO DIA'}`
  );
}

export async function excluirProduto(id: string, nome: string): Promise<void> {
  const path = `produtos/${id}`;
  try {
    await deleteDoc(doc(db, 'produtos', id));
    await registrarLogAuditoria('Exclusão de Produto', `Produto "${nome}" removido do cardápio`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function uploadImagemProduto(file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(storage, `produtos/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
