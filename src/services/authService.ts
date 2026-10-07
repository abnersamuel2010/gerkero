import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase/config';
import { Usuario, UserRole } from '../types';
import { generateSafeId } from '../utils/formatters';

export async function registrarLogAuditoria(
  acao: string,
  detalhes: string,
  usuarioNome?: string
): Promise<void> {
  if (!auth.currentUser) return;
  const logId = generateSafeId('log');
  const path = `logsAuditoria/${logId}`;
  try {
    await setDoc(doc(db, 'logsAuditoria', logId), {
      acao: acao.slice(0, 100),
      detalhes: detalhes.slice(0, 400),
      usuarioId: auth.currentUser.uid.slice(0, 128),
      usuarioNome: (usuarioNome || auth.currentUser.displayName || auth.currentUser.email || 'Usuário').slice(0, 120),
      criadoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Não foi possível salvar log de auditoria:', error);
  }
}

export async function ensureUserProfile(fbUser: User): Promise<Usuario> {
  if (fbUser.isAnonymous) {
    return {
      id: fbUser.uid,
      uid: fbUser.uid,
      nome: 'Cliente Delivery',
      email: 'cliente@delivery.local',
      funcao: 'atendente',
      bloqueado: false,
      permissoes: 'delivery',
      criadoEm: new Date().toISOString(),
    };
  }

  const path = `usuarios/${fbUser.uid}`;
  try {
    const userRef = doc(db, 'usuarios', fbUser.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<Usuario, 'id'>) };
    }

    const defaultRole: UserRole = 'administrador';
    const newProfile: Omit<Usuario, 'id'> = {
      uid: fbUser.uid.slice(0, 128),
      nome: (fbUser.displayName || fbUser.email?.split('@')[0] || 'Administrador').slice(0, 120),
      email: (fbUser.email || 'admin@restaurante.com.br').slice(0, 160),
      funcao: defaultRole,
      bloqueado: false,
      permissoes: 'acesso_total,dashboard,delivery,pedidos,mesas,comandas,cozinha,caixa,cardapio,clientes,entregadores,relatorios,usuarios,configuracoes',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    await setDoc(userRef, newProfile);
    return { id: fbUser.uid, ...newProfile };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loginWithGoogle(): Promise<Usuario> {
  const cred = await signInWithPopup(auth, googleProvider);
  return ensureUserProfile(cred.user);
}

export async function loginAnonymously(): Promise<Usuario> {
  const cred = await signInAnonymously(auth);
  return ensureUserProfile(cred.user);
}

export async function loginWithEmail(email: string, pass: string): Promise<Usuario> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return ensureUserProfile(cred.user);
}

export async function registerWithEmail(
  nome: string,
  email: string,
  pass: string,
  funcao: UserRole = 'administrador'
): Promise<Usuario> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const path = `usuarios/${cred.user.uid}`;
  try {
    const newProfile: Omit<Usuario, 'id'> = {
      uid: cred.user.uid.slice(0, 128),
      nome: nome.trim().slice(0, 120),
      email: email.trim().slice(0, 160),
      funcao,
      bloqueado: false,
      permissoes: 'acesso_padrao',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    await setDoc(doc(db, 'usuarios', cred.user.uid), newProfile);
    return { id: cred.user.uid, ...newProfile };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}
