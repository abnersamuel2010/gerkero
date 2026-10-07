import React, { useState } from 'react';
import { LogIn, Mail, Lock, UserPlus, HelpCircle, UtensilsCrossed } from 'lucide-react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  loginAnonymously,
} from '../services/authService';
import { UserRole } from '../types';
import { IMAGENS_PADRAO } from '../services/firestoreService';

interface LoginPageProps {
  onAbrirCardapioCliente?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAbrirCardapioCliente }) => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [funcao, setFuncao] = useState<UserRole>('administrador');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarGuiaFirebase, setMostrarGuiaFirebase] = useState(false);

  const handleGoogleLogin = async () => {
    setErro('');
    setCarregando(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Erro ao autenticar com o Google. Verifique a janela popup.'
      );
    } finally {
      setCarregando(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setErro('');
    setCarregando(true);
    try {
      await loginAnonymously();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed') || msg.includes('admin-restricted')) {
        setErro(
          'O provedor Anônimo ainda não foi ativado no Firebase Console. Utilize o botão "Entrar com Conta Google" ou veja as instruções abaixo.'
        );
      } else {
        setErro(`Erro ao entrar: ${msg}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (modo === 'login') {
        await loginWithEmail(email, senha);
      } else {
        await registerWithEmail(nome || 'Operador', email, senha, funcao);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed')) {
        setErro(
          'O provedor de E-mail/Senha ainda não foi ativado no Firebase Console. Utilize o botão "Entrar com Conta Google" ou consulte o Guia de Configuração abaixo.'
        );
      } else {
        setErro(`Não foi possível autenticar: ${msg}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid lg:grid-cols-12">
      {/* Coluna Visual Esquerda */}
      <div className="hidden lg:flex lg:col-span-7 relative overflow-hidden bg-slate-900 flex-col justify-between p-12">
        <img
          src={IMAGENS_PADRAO.buffetHero}
          alt="Restaurante Sabor & Brasa"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />

        <div className="relative z-10">
          <span className="text-2xl font-bold tracking-tight text-white font-display">
            Sabor & Brasa
          </span>
        </div>

        <div className="relative z-10 max-w-xl space-y-4">
          <h1 className="text-3xl xl:text-4xl font-bold text-white font-display leading-tight">
            Gestão integrada em tempo real para Marmitaria, Delivery, Salão e Cozinha.
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Controle completo de pedidos estilo iFood, montagem de marmitas, mapa de mesas,
            comandas digitais com buffet, tela KDS para cozinha e fechamento de caixa diário
            conectado ao Cloud Firestore.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span>Administrador</span>
            <span aria-hidden="true">·</span>
            <span>Caixa PDV</span>
            <span aria-hidden="true">·</span>
            <span>Garçom / Atendente</span>
            <span aria-hidden="true">·</span>
            <span>Cozinha KDS</span>
            <span aria-hidden="true">·</span>
            <span>Entregadores</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          Infraestrutura Cloud Firestore & Firebase Authentication
        </div>
      </div>

      {/* Coluna de Login Direita */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12 bg-white text-slate-900">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              Acesso ao Sistema
            </h2>
            <p className="text-sm text-slate-600">
              Entre com sua conta Google (recomendado e já provisionado) ou utilize suas credenciais.
            </p>
          </div>

          {onAbrirCardapioCliente && (
            <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0" />
                  É um cliente querendo pedir delivery?
                </div>
                <p className="text-[11px] text-amber-800">
                  Não precisa de login para pedir! Acesse o cardápio e monte seu pedido.
                </p>
              </div>
              <button
                type="button"
                onClick={onAbrirCardapioCliente}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all text-center shrink-0"
              >
                Abrir Cardápio Delivery
              </button>
            </div>
          )}

          {erro && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 leading-relaxed">
              {erro}
            </div>
          )}

          {/* Botão Principal Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={carregando}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 shadow-xs"
          >
            <LogIn className="w-4 h-4" />
            {carregando ? 'Conectando ao Firebase...' : 'Entrar com Conta Google'}
          </button>

          <button
            type="button"
            onClick={handleAnonymousLogin}
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            Acesso Rápido de Demonstração / Convidado (Sem Popup)
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-xs text-slate-400">
              ou acesso por e-mail e senha
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setModo('login')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                modo === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entrar com E-mail
            </button>
            <button
              type="button"
              onClick={() => setModo('cadastro')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                modo === 'cadastro'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cadastrar Operador
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {modo === 'cadastro' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Mendes"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Função Inicial no Restaurante
                  </label>
                  <select
                    value={funcao}
                    onChange={(e) => setFuncao(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600 bg-white"
                  >
                    <option value="administrador">Administrador</option>
                    <option value="caixa">Caixa</option>
                    <option value="atendente">Atendente / Garçom</option>
                    <option value="cozinha">Cozinha</option>
                    <option value="entregador">Entregador</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operador@restaurante.com.br"
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {modo === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Acessar com E-mail
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Criar Conta de Operador
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setMostrarGuiaFirebase(!mostrarGuiaFirebase)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Como configurar provedores adicionais no Firebase Console?
            </button>

            {mostrarGuiaFirebase && (
              <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-2 leading-relaxed">
                <p className="font-semibold text-slate-900">
                  Configuração Manual no Firebase Console (Opcional):
                </p>
                <p>
                  1. O login com <strong>Google</strong> e o banco <strong>Cloud Firestore</strong> já
                  estão configurados e prontos em <code>firebase-applet-config.json</code>.
                </p>
                <p>
                  2. Para habilitar login por <strong>E-mail/Senha</strong>: acesse{' '}
                  <em>console.firebase.google.com</em> → selecione o projeto →{' '}
                  <strong>Authentication</strong> → <strong>Sign-in method</strong> → ative{' '}
                  <strong>E-mail/Senha</strong>.
                </p>
                <p>
                  3. Para upload de fotos no <strong>Firebase Storage</strong>: acesse{' '}
                  <strong>Storage</strong> no Firebase Console e clique em <em>Começar</em>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
