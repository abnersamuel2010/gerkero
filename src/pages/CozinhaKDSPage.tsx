import React, { useEffect, useState } from 'react';
import { Clock, Printer, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  PedidoCozinha,
  StatusCozinha,
  Pedido,
  ThermalReceiptData,
} from '../types';
import { atualizarStatusCozinhaKDS } from '../services/cozinhaService';
import {
  formatTimeOnly,
  formatDateTime,
  getMinutesElapsed,
} from '../utils/formatters';

interface CozinhaKDSPageProps {
  pedidosCozinha: PedidoCozinha[];
  pedidos: Pedido[];
  onPrintReceipt: (receipt: ThermalReceiptData) => void;
}

export const CozinhaKDSPage: React.FC<CozinhaKDSPageProps> = ({
  pedidosCozinha,
  pedidos,
  onPrintReceipt,
}) => {
  // Atualiza o relógio a cada 30s para recalcular tempo de espera
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const ordensAtivas = [...pedidosCozinha]
    .filter((k) => k.status !== 'finalizado')
    .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));

  const colunas: { status: StatusCozinha; titulo: string }[] = [
    { status: 'novo', titulo: '1. NOVOS (Fila de Entrada)' },
    { status: 'em_preparo', titulo: '2. EM PREPARO (Na Chapa/Fogão)' },
    { status: 'pronto', titulo: '3. PRONTOS (Expedição / Garçom)' },
  ];

  const handleImprimirKDS = (item: PedidoCozinha) => {
    onPrintReceipt({
      titulo: 'COMANDA DE PRODUÇÃO — COZINHA',
      numeroDocumento: `ORDEM #${item.numero}`,
      dataHora: formatDateTime(item.criadoEm),
      clienteOuMesa: item.identificacao,
      linhas: item.itensTexto.split(' | ').map((txt) => ({
        descricao: txt,
      })),
      observacoesGerais: item.observacoes,
      rodape: 'VIA DA COZINHA (KDS)',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Cozinha — Tela KDS (Kitchen Display System)
          </h1>
          <p className="text-sm text-slate-600">
            Pedidos de Delivery, Marmitas, Balcão e Mesas em tempo real. Ao marcar como &ldquo;Pronto&rdquo;, o status é atualizado em todo o sistema.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            No prazo (&lt; 15 min)
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1.5 text-red-700 font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Alerta de Atraso (&ge; 15 min)
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {colunas.map((col) => {
          const itensColuna = ordensAtivas.filter((k) => k.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-4 min-h-[520px]"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold tracking-wide text-white">
                  {col.titulo}
                </h2>
                <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                  {itensColuna.length}
                </span>
              </div>

              {itensColuna.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  Nenhum pedido nesta etapa
                </div>
              ) : (
                <div className="space-y-3.5">
                  {itensColuna.map((item) => {
                    const minutos = getMinutesElapsed(item.criadoEm);
                    const atrasado =
                      minutos >= 15 && item.status !== 'pronto';

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl p-4 space-y-3 border-2 transition-colors ${
                          atrasado
                            ? 'bg-red-950/70 border-red-500 text-white'
                            : item.status === 'pronto'
                            ? 'bg-emerald-950/50 border-emerald-600/70 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                          <div>
                            <div className="text-base font-bold font-mono tabular-nums text-amber-400">
                              #{item.numero} · {item.origem.toUpperCase()}
                            </div>
                            <div className="text-xs font-medium text-slate-200">
                              {item.identificacao}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="inline-flex items-center gap-1 text-xs font-mono tabular-nums">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTimeOnly(item.criadoEm)}
                            </div>
                            <div
                              className={`text-xs font-mono tabular-nums font-bold ${
                                atrasado ? 'text-red-300' : 'text-slate-400'
                              }`}
                            >
                              {minutos} min {atrasado ? '— ATRASADO!' : ''}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-sm font-medium leading-relaxed">
                          {item.itensTexto.split(' | ').map((linha, i) => (
                            <div
                              key={i}
                              className="p-2 bg-slate-950/50 rounded-lg border border-white/5"
                            >
                              {linha}
                            </div>
                          ))}
                        </div>

                        {item.observacoes && (
                          <div className="p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-lg text-xs text-amber-200 font-semibold">
                            ATENÇÃO / OBS: {item.observacoes}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleImprimirKDS(item)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                            title="Imprimir comanda na cozinha"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {item.status === 'novo' && (
                            <button
                              type="button"
                              onClick={() =>
                                atualizarStatusCozinhaKDS(
                                  item,
                                  'em_preparo',
                                  pedidos
                                )
                              }
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              <Play className="w-4 h-4" />
                              Iniciar Preparo
                            </button>
                          )}

                          {item.status === 'em_preparo' && (
                            <button
                              type="button"
                              onClick={() =>
                                atualizarStatusCozinhaKDS(item, 'pronto', pedidos)
                              }
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Marcar como PRONTO
                            </button>
                          )}

                          {item.status === 'pronto' && (
                            <button
                              type="button"
                              onClick={() =>
                                atualizarStatusCozinhaKDS(
                                  item,
                                  'finalizado',
                                  pedidos
                                )
                              }
                              className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                            >
                              Arquivar da Tela KDS
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
