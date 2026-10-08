import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Usuario, UserRole, ConfiguracaoRestaurante, ImpressoraTermica } from '../types';
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
      nomeRestaurante: (dados.nomeRestaurante || 'RESTAURANTE KERO').trim().slice(0, 120),
      telefoneRestaurante: (dados.telefoneRestaurante || '').trim().slice(0, 40),
      enderecoRestaurante: (dados.enderecoRestaurante || '').trim().slice(0, 300),
      cep: (dados.cep || '').trim().slice(0, 30),
      cnpj: (dados.cnpj || '').trim().slice(0, 40),
      instagram: (dados.instagram || '').trim().slice(0, 200),
      facebook: (dados.facebook || '').trim().slice(0, 200),
      whatsapp: (dados.whatsapp || '').trim().slice(0, 40),
      precoMarmitaP: Math.max(0, Number(dados.precoMarmitaP) || 0),
      precoMarmitaM: Math.max(0, Number(dados.precoMarmitaM) || 0),
      precoMarmitaG: Math.max(0, Number(dados.precoMarmitaG) || 0),
      precoBuffetAdulto: Math.max(0, Number(dados.precoBuffetAdulto) || 0),
      precoBuffetCrianca: Math.max(0, Number(dados.precoBuffetCrianca) || 0),
      precoBuffetKilo: Math.max(0, Number(dados.precoBuffetKilo) || 0),
      logoUrl: (dados.logoUrl || '').trim().slice(0, 1000000),
      bannerUrl: (dados.bannerUrl || '').trim().slice(0, 1000000),
      corPrimaria: (dados.corPrimaria || '#e11d48').trim().slice(0, 50),
      corTemaNome: (dados.corTemaNome || 'vermelho_kero').trim().slice(0, 60),
      corFundo: (dados.corFundo || '#0b0f19').trim().slice(0, 50),
      corFundoNome: (dados.corFundoNome || 'escuro_slate').trim().slice(0, 60),
      corBotoes: (dados.corBotoes || '#f59e0b').trim().slice(0, 50),
      iconeTema: (dados.iconeTema || 'flame').trim().slice(0, 60),
      iconeCustomUrl: (dados.iconeCustomUrl || '').trim().slice(0, 1000000),
      atualizadoEm: agora,
    };

    // Cache local imediato para persistência instantânea no navegador
    try {
      localStorage.setItem('kero_configuracao_local', JSON.stringify({ ...payload, id: 'geral' }));
    } catch {
      // Ignora restrições eventuais do storage
    }

    // Aplicação imediata das variáveis de estilo no documento
    if (typeof document !== 'undefined') {
      if (payload.corPrimaria) document.documentElement.style.setProperty('--cor-primaria', String(payload.corPrimaria));
      if (payload.corFundo) document.documentElement.style.setProperty('--cor-fundo', String(payload.corFundo));
      if (payload.corBotoes) document.documentElement.style.setProperty('--cor-botoes', String(payload.corBotoes));
      const favicon = (payload.logoUrl as string) || (payload.iconeCustomUrl as string);
      if (favicon) {
        const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (link) link.href = favicon;
      }
    }

    // Persistência no Cloud Firestore
    await setDoc(doc(db, 'configuracoes', 'geral'), payload, { merge: true });
    await registrarLogAuditoria(
      'Alteração de Configuração/Preços/Cores',
      `Identidade visual e dados atualizados: Primária=${payload.corPrimaria}, Fundo=${payload.corFundo}, Botões=${payload.corBotoes}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Gerenciamento de Impressoras Térmicas via IP por Setor (Cozinha, Caixa, Bar)
 */
export async function criarImpressoraTermica(dados: {
  nome: string;
  ip: string;
  porta?: number;
  setor: 'cozinha' | 'caixa' | 'bar' | 'todos';
  larguraBobina?: '80mm' | '58mm';
  modelo?: string;
  ativo?: boolean;
}): Promise<string> {
  const id = generateSafeId('imp');
  const path = `impressoras/${id}`;
  const agora = new Date().toISOString();
  try {
    const payload: ImpressoraTermica = {
      id,
      nome: dados.nome.trim().slice(0, 80),
      ip: dados.ip.trim().slice(0, 45),
      porta: Number(dados.porta) || 9100,
      setor: dados.setor,
      larguraBobina: dados.larguraBobina || '80mm',
      modelo: (dados.modelo || 'EPSON / Bematech ESC/POS').trim().slice(0, 80),
      ativo: dados.ativo !== undefined ? dados.ativo : true,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    await setDoc(doc(db, 'impressoras', id), payload);
    await registrarLogAuditoria(
      'Cadastro de Impressora Térmica IP',
      `Impressora "${dados.nome}" (${dados.ip}:${dados.porta || 9100}) cadastrada para o setor ${dados.setor}`
    );
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function atualizarImpressoraTermica(
  id: string,
  dados: Partial<Omit<ImpressoraTermica, 'id' | 'criadoEm'>>
): Promise<void> {
  const path = `impressoras/${id}`;
  try {
    const payload: Record<string, unknown> = {
      atualizadoEm: new Date().toISOString(),
    };
    if (dados.nome !== undefined) payload.nome = dados.nome.trim().slice(0, 80);
    if (dados.ip !== undefined) payload.ip = dados.ip.trim().slice(0, 45);
    if (dados.porta !== undefined) payload.porta = Number(dados.porta) || 9100;
    if (dados.setor !== undefined) payload.setor = dados.setor;
    if (dados.larguraBobina !== undefined) payload.larguraBobina = dados.larguraBobina;
    if (dados.modelo !== undefined) payload.modelo = dados.modelo.trim().slice(0, 80);
    if (dados.ativo !== undefined) payload.ativo = Boolean(dados.ativo);

    await updateDoc(doc(db, 'impressoras', id), payload);
    await registrarLogAuditoria(
      'Atualização de Impressora Térmica',
      `Impressora ID ${id} atualizada no setor ${dados.setor || 'mantido'}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function excluirImpressoraTermica(id: string): Promise<void> {
  const path = `impressoras/${id}`;
  try {
    await deleteDoc(doc(db, 'impressoras', id));
    await registrarLogAuditoria(
      'Exclusão de Impressora Térmica',
      `Impressora ID ${id} removida do sistema`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}
