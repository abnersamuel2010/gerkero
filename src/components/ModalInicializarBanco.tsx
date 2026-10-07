import React, { useState } from 'react';
import {
  Database,
  X,
  Sparkles,
  Layers,
  FlaskConical,
  CheckCircle2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  inicializarBancoDeDadosReal,
  inicializarDadosDemonstracao,
  converterDemonstracaoParaReal,
  sincronizarCardapioCompletoOficial,
  limparItensDemonstracao,
  limparHistoricoPedidosEComandas,
} from '../services/firestoreService';

interface ModalInicializarBancoProps {
  aberto: boolean;
  onClose: () => void;
  temDadosDemo: boolean;
  totalProdutos: number;
  totalMesas: number;
}

export const ModalInicializarBanco: React.FC<ModalInicializarBancoProps> = ({
  aberto,
  onClose,
  temDadosDemo,
  totalProdutos,
  totalMesas,
}) => {
  const [carregando, setCarregando] = useState(false);
  const [feedback, setFeedback] = useState<{
    tipo: 'sucesso' | 'erro';
    mensagem: string;
  } | null>(null);

  if (!aberto) return null;

  const executarAcao = async (
    acao: () => Promise<void | number>,
    mensagemSucesso: string
  ) => {
    setCarregando(true);
    setFeedback(null);
    try {
      await acao();
      setFeedback({
        tipo: 'sucesso',
        mensagem: mensagemSucesso,
      });
    } catch (err: unknown) {
      setFeedback({
        tipo: 'erro',
        mensagem:
          err instanceof Error
            ? err.message
            : 'Erro ao executar operação no Cloud Firestore.',
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600 text-white rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Inicialização do Banco de Dados Real
              </h2>
              <p className="text-xs text-slate-500">
                Cloud Firestore · Projeto eminent-invention-fmn89
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Atual do Banco */}
          <div className="p-3.5 bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <div>
              <span>Status do Banco: </span>
              <strong className="text-slate-900">
                {totalMesas > 0 ? 'Estrutura Inicializada' : 'Vazio / Não Inicializado'}
              </strong>
            </div>
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span>{totalMesas} mesas</span>
              <span>·</span>
              <span>{totalProdutos} produtos {temDadosDemo ? '(com demo)' : ''}</span>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                feedback.tipo === 'sucesso'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1">{feedback.mensagem}</div>
            </div>
          )}

          {/* Opções de Inicialização */}
          <div className="space-y-3">
            {/* Opção 1: Banco Real Completo */}
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 hover:bg-amber-50 transition-colors space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-600 text-white rounded-lg shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      Iniciar Banco de Dados Real Oficial (Recomendado)
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Inicializa o restaurante com 12 mesas, 9 categorias oficiais, taxas de entrega e cardápio oficial limpo com fotos reais de alta definição. <strong>Nenhum item possui etiqueta [Demo]</strong>.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={carregando}
                  onClick={() =>
                    executarAcao(
                      () => inicializarBancoDeDadosReal(true),
                      'Banco de dados real oficial inicializado com sucesso! Mesas, categorias, produtos reais e taxas foram configurados no Cloud Firestore.'
                    )
                  }
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {carregando ? 'Gravando no Firestore...' : 'Iniciar Banco Real Oficial'}
                </button>
              </div>
            </div>

            {/* Opção 2: Banco Real Limpo */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800 text-white rounded-lg shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Iniciar Banco Real Limpo (Estrutura Base Sem Produtos)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cria apenas as 12 mesas físicas do salão, 9 categorias de cardápio e 3 regiões de entrega, deixando o cardápio de produtos 100% zerado para você cadastrar seus itens do zero.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={carregando}
                  onClick={() =>
                    executarAcao(
                      () => inicializarBancoDeDadosReal(false),
                      'Banco real limpo configurado com sucesso! Mesas, categorias e regiões foram criadas no Firestore com cardápio zerado.'
                    )
                  }
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {carregando ? 'Gravando no Firestore...' : 'Iniciar Estrutura Limpa'}
                </button>
              </div>
            </div>

            {/* Opção 3: Modo Demonstração */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800">
                    Modo de Demonstração / Treinamento
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Carrega dados marcados com [Demo] para testar todas as telas.
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={carregando}
                onClick={() =>
                  executarAcao(
                    () => inicializarDadosDemonstracao(),
                    'Dados de demonstração carregados com sucesso no Cloud Firestore!'
                  )
                }
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded-lg disabled:opacity-50 whitespace-nowrap"
              >
                Carregar Demo
              </button>
            </div>
          </div>

          {/* Ferramentas Adicionais de Manutenção */}
          <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Ferramentas de Manutenção e Limpeza
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={carregando}
                onClick={() =>
                  executarAcao(
                    () => sincronizarCardapioCompletoOficial(),
                    'Cardápio semanal completo sincronizado com sucesso! Marmitas (P/M/G), Carnes da Semana, Bebidas com estoque, Porções, Doces e Saladas foram gravados no Cloud Firestore.'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg hover:bg-amber-100 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                Sincronizar Cardápio Oficial Completo (Marmitas, Bebidas, Carnes)
              </button>

              {temDadosDemo && (
                <button
                  type="button"
                  disabled={carregando}
                  onClick={() =>
                    executarAcao(
                      () => converterDemonstracaoParaReal(),
                      'Todos os produtos de demonstração foram convertidos em itens oficiais reais (as etiquetas [Demo] foram removidas)!'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Converter Itens Demo para Oficial Real
                </button>
              )}

              {temDadosDemo && (
                <button
                  type="button"
                  disabled={carregando}
                  onClick={() =>
                    executarAcao(
                      () => limparItensDemonstracao(),
                      'Itens de demonstração foram excluídos do Firestore.'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover Apenas Produtos Demo
                </button>
              )}

              <button
                type="button"
                disabled={carregando}
                onClick={() => {
                  if (
                    window.confirm(
                      'Deseja realmente limpar todos os pedidos, comandas, entregas e ordens de teste e liberar todas as mesas?'
                    )
                  ) {
                    executarAcao(
                      () => limparHistoricoPedidosEComandas(),
                      'Histórico de pedidos, comandas e ordens de cozinha foi zerado com sucesso! As mesas foram liberadas.'
                    );
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Zerar Histórico de Pedidos de Teste
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Concluir / Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
