import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Usuario, UserRole, ConfiguracaoRestaurante } from '../types';
import { generateSafeId } from '../utils/formatters';
import { registrarLogAuditoria } from './authService';

export async function criarUsuarioPainelAdmin(dados: {
  nome: string;
  email: string;
  funcao: UserRole;
  permissoes?: string;
}): Promise<string> {
  const id = generateSafeId('usr');
  const agora = new Date().toISOString();
  const path = `usuarios/${id}`;
  try {
    await setDoc(doc(db, 'usuarios', id), {
      uid: id,
      nome: dados.nome.trim().slice(0, 120),
      email: dados.email.trim().slice(0, 160),
      funcao: dados.funcao,
      bloqueado: false,
      permissoes: (dados.permissoes || obterPermissoesPadraoPorFuncao(dados.funcao)).slice(0, 500),
      criadoEm: agora,
      atualizadoEm: agora,
    });
    await registrarLogAuditoria(
      'Criação de Usuário',
      `Usuário "${dados.nome}" (${dados.email}) cadastrado com função ${dados.funcao}`
    );
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function atualizarUsuarioPainelAdmin(
  usuario: Usuario,
  dados: Partial<Pick<Usuario, 'nome' | 'email' | 'funcao' | 'bloqueado' | 'permissoes'>>
): Promise<void> {
  const path = `usuarios/${usuario.id}`;
  try {
    const updateData: Record<string, unknown> = {
      atualizadoEm: new Date().toISOString(),
    };
    if (dados.nome !== undefined) updateData.nome = dados.nome.trim().slice(0, 120);
    if (dados.email !== undefined) updateData.email = dados.email.trim().slice(0, 160);
    if (dados.funcao !== undefined) updateData.funcao = dados.funcao;
    if (dados.bloqueado !== undefined) updateData.bloqueado = Boolean(dados.bloqueado);
    if (dados.permissoes !== undefined) updateData.permissoes = dados.permissoes.slice(0, 500);

    await updateDoc(doc(db, 'usuarios', usuario.id), updateData);
    await registrarLogAuditoria(
      'Alteração de Usuário',
      `Usuário "${usuario.nome}" atualizado (Função: ${dados.funcao || usuario.funcao}, Bloqueado: ${dados.bloqueado ?? usuario.bloqueado})`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function excluirUsuarioPainelAdmin(usuario: Usuario): Promise<void> {
  const path = `usuarios/${usuario.id}`;
  try {
    await deleteDoc(doc(db, 'usuarios', usuario.id));
    await registrarLogAuditoria('Exclusão de Usuário', `Usuário "${usuario.nome}" excluído`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function obterPermissoesPadraoPorFuncao(funcao: UserRole): string {
  switch (funcao) {
    case 'administrador':
      return 'dashboard,marmitas,delivery_cliente,delivery_painel,pedidos,mesas,comandas,cozinha,caixa,cardapio,clientes_entregadores,relatorios,usuarios_config';
    case 'caixa':
      return 'dashboard,caixa,pedidos,comandas,mesas,relatorios';
    case 'atendente':
      return 'marmitas,delivery_cliente,delivery_painel,pedidos,mesas,comandas';
    case 'cozinha':
      return 'cozinha';
    case 'entregador':
      return 'delivery_painel,clientes_entregadores';
  }
}

export async function salvarConfiguracaoRestaurante(
  dados: Omit<ConfiguracaoRestaurante, 'id' | 'atualizadoEm'>
): Promise<void> {
  const path = 'configuracoes/geral';
  const agora = new Date().toISOString();
  try {
    const payload: Record<string, unknown> = {
      nomeRestaurante: dados.nomeRestaurante.trim().slice(0, 120),
      telefoneRestaurante: (dados.telefoneRestaurante || '').trim().slice(0, 30),
      enderecoRestaurante: (dados.enderecoRestaurante || '').trim().slice(0, 240),
      cnpj: (dados.cnpj || '').trim().slice(0, 30),
      precoMarmitaP: Math.max(0, Number(dados.precoMarmitaP) || 0),
      precoMarmitaM: Math.max(0, Number(dados.precoMarmitaM) || 0),
      precoMarmitaG: Math.max(0, Number(dados.precoMarmitaG) || 0),
      precoBuffetAdulto: Math.max(0, Number(dados.precoBuffetAdulto) || 0),
      precoBuffetCrianca: Math.max(0, Number(dados.precoBuffetCrianca) || 0),
      precoBuffetKilo: Math.max(0, Number(dados.precoBuffetKilo) || 0),
      atualizadoEm: agora,
    };
    if (dados.logoUrl) {
      payload.logoUrl = dados.logoUrl.trim().slice(0, 500);
    }
    await setDoc(doc(db, 'configuracoes', 'geral'), payload);
    await registrarLogAuditoria(
      'Alteração de Configuração/Preços',
      `Configurações atualizadas: Marmita P=R$${payload.precoMarmitaP}, M=R$${payload.precoMarmitaM}, G=R$${payload.precoMarmitaG}, Buffet Adulto=R$${payload.precoBuffetAdulto}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
