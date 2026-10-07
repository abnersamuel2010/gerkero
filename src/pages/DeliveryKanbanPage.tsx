import React, { useState } from 'react';
import {
  Printer,
  Truck,
  MapPin,
  ArrowRight,
  Plus,
  Trash2,
  Share2,
} from 'lucide-react';
import {
  Pedido,
  PedidoStatus,
  Entregador,
  RegiaoEntrega,
  Caixa,
  ThermalReceiptData,
} from '../types';
import { atualizarStatusPedido } from '../services/pedidosService';
import {
  atribuirPedidoAoEntregador,
  criarRegiaoEntrega,
  atualizarRegiaoEntrega,
  excluirRegiaoEntrega,
} from '../services/deliveryService';
import {
  formatCurrency,
  formatTimeOnly,
  formatDateTime,
  formatFormaPagamento,
} from '../utils/formatters';

interface DeliveryKanbanPageProps {
  pedidos: Pedido[];
  entregadores: Entregador[];
  regioes: RegiaoEntrega[];
  caixaAberto: Caixa | null;
  ehAdmin: boolean;
  onPrintReceipt: (receipt: ThermalReceiptData) => void;
  onOpenLinkClienteModal?: () => void;
}

const COLUNAS_KANBAN: { status: PedidoStatus; titulo: string }[] = [
  { status: 'novo', titulo: '1. Novos' },
  { status: 'confirmando', titulo: '2. Confirmando' },
  { status: 'em_preparo', titulo: '3. Em Preparo' },
  { status: 'pronto', titulo: '4. Pronto' },
  { status: 'saiu_para_entrega', titulo: '5. Saiu p/ Entrega' },
  { status: 'entregue', titulo: '6. Entregue' },
];

export const DeliveryKanbanPage: React.FC<DeliveryKanbanPageProps> = ({
  pedidos,
  entregadores,
  regioes,
  caixaAberto,
  ehAdmin,
  onPrintReceipt,
  onOpenLinkClienteModal,
}) => {
  const [modalRegioes, setModalRegioes] = useState(false);
  const [nomeRegiao, setNomeRegiao] = useState('');
  const [taxaRegiao, setTaxaRegiao] = useState('8.00');
  const [tempoRegiao, setTempoRegiao] = useState('35');

  const pedidosDelivery = pedidos
    .filter((p) => p.origem === 'delivery' && p.status !== 'cancelado')
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  const avancarFase = async (ped: Pedido) => {
    const ordem: PedidoStatus[] = [
      'novo',
      'confirmando',
      'em_preparo',
      'pronto',
      'saiu_para_entrega',
      'entregue',
    ];
    const idx = ordem.indexOf(ped.status);
    if (idx >= 0 && idx < ordem.length - 1) {
      await atualizarStatusPedido(ped, ordem[idx + 1], caixaAberto);
    }
  };

  const handleAtribuirEntregador = async (ped: Pedido, entregadorId: string) => {
    const ent = entregadores.find((e) => e.id === entregadorId);
    if (!ent) return;
    await atribuirPedidoAoEntregador(ped, ent, true);
  };

  const handleImprimirDelivery = (ped: Pedido) => {
    onPrintReceipt({
      titulo: 'CUPOM DE ENTREGA DELIVERY',
      numeroDocumento: `PEDIDO #${ped.numero}`,
      dataHora: formatDateTime(ped.criadoEm),
      clienteOuMesa: ped.clienteNome,
      telefone: ped.clienteTelefone,
      endereco: `${ped.enderecoEntrega || ''} ${
        ped.regiaoNome ? `(${ped.regiaoNome})` : ''
      }`,
      linhas: [
        {
          descricao: ped.resumoItens || 'Itens do pedido',
          valor: ped.subtotal,
        },
      ],
      subtotal: ped.subtotal,
      taxaEntrega: ped.taxaEntrega || 0,
      total: ped.total,
      formaPagamento: formatFormaPagamento(ped.formaPagamento),
      troco:
        ped.trocoPara && ped.trocoPara > ped.total
          ? `Levar troco p/ ${formatCurrency(ped.trocoPara)} (Troco: ${formatCurrency(
              ped.trocoPara - ped.total
            )})`
          : undefined,
      observacoesGerais: ped.observacoes,
    });
  };

  const handleAdicionarRegiao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeRegiao.trim()) return;
    await criarRegiaoEntrega({
      nome: nomeRegiao,
      taxa: parseFloat(taxaRegiao.replace(',', '.')) || 0,
      tempoEstimadoMin: parseInt(tempoRegiao, 10) || 35,
      ativo: true,
    });
    setNomeRegiao('');
    setTaxaRegiao('8.00');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Painel Kanban de Delivery
          </h1>
          <p className="text-sm text-slate-600">
            Acompanhe os pedidos em tempo real desde o recebimento até a entrega e atribua entregadores
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenLinkClienteModal && (
            <button
              type="button"
              onClick={onOpenLinkClienteModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              Link do Cardápio para Clientes
            </button>
          )}

          <button
            onClick={() => setModalRegioes(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            <MapPin className="w-4 h-4" />
            Taxas por Rua / Bairro ({regioes.length})
          </button>
        </div>
      </div>

      {/* Quadro Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-start">
        {COLUNAS_KANBAN.map((col) => {
          const lista = pedidosDelivery.filter((p) => p.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-slate-100/90 border border-slate-200 rounded-xl p-3 space-y-3 min-h-[420px]"
            >
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-slate-800">
                  {col.titulo}
                </h2>
                <span className="text-xs font-mono tabular-nums font-semibold text-slate-600">
                  {lista.length}
                </span>
              </div>

              {lista.length === 0 ? (
                <div className="py-12 text-center text-[11px] text-slate-400">
                  Sem pedidos nesta etapa
                </div>
              ) : (
                <div className="space-y-3">
                  {lista.map((ped) => (
                    <div
                      key={ped.id}
                      className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-mono tabular-nums font-bold text-sm text-slate-900">
                          #{ped.numero}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {formatTimeOnly(ped.criadoEm)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900">
                          {ped.clienteNome}
                        </div>
                        {ped.clienteTelefone && (
                          <div className="text-slate-500">{ped.clienteTelefone}</div>
                        )}
                        {ped.enderecoEntrega && (
                          <div className="text-slate-600 leading-snug">
                            {ped.enderecoEntrega}
                          </div>
                        )}
                        {ped.regiaoNome && (
                          <div className="text-[11px] text-amber-700 font-medium">
                            {ped.regiaoNome} (+{formatCurrency(ped.taxaEntrega || 0)})
                          </div>
                        )}
                      </div>

                      <div className="p-2 bg-slate-50 rounded border border-slate-100 text-slate-700 leading-relaxed">
                        {ped.resumoItens || 'Itens do pedido'}
                        {ped.observacoes && (
                          <div className="text-amber-800 font-medium mt-1">
                            Obs: {ped.observacoes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-600">
                          {formatFormaPagamento(ped.formaPagamento)}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-sm text-slate-900">
                          {formatCurrency(ped.total)}
                        </span>
                      </div>

                      {/* Seleção de Entregador */}
                      {(ped.status === 'pronto' ||
                        ped.status === 'saiu_para_entrega') && (
                        <div className="pt-1">
                          <label className="block text-[11px] text-slate-500 mb-1">
                            <Truck className="w-3 h-3 inline mr-1" />
                            Entregador atribuído:
                          </label>
                          <select
                            value={ped.entregadorId || ''}
                            onChange={(e) =>
                              handleAtribuirEntregador(ped, e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                          >
                            <option value="">Atribuir entregador...</option>
                            {entregadores.map((ent) => (
                              <option key={ent.id} value={ent.id}>
                                {ent.nome} ({ent.status})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleImprimirDelivery(ped)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Imprimir Cupom"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {ped.status !== 'entregue' && (
                          <button
                            type="button"
                            onClick={() => avancarFase(ped)}
                            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded transition-colors"
                          >
                            <span>Avançar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Regiões e Taxas de Entrega */}
      {modalRegioes && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display">
                  Taxas de Entrega por Rua / Bairro
                </h2>
                <p className="text-xs text-slate-500">
                  A taxa configurada de acordo com a rua é adicionada automaticamente ao pedido do cliente
                </p>
              </div>
              <button
                onClick={() => setModalRegioes(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleAdicionarRegiao} className="grid sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                required
                value={nomeRegiao}
                onChange={(e) => setNomeRegiao(e.target.value)}
                placeholder="Ex: Rua XV de Novembro, Centro..."
                className="sm:col-span-6 px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                step="0.50"
                min="0"
                required
                value={taxaRegiao}
                onChange={(e) => setTaxaRegiao(e.target.value)}
                placeholder="Taxa R$"
                className="sm:col-span-3 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono tabular-nums"
              />
              <button
                type="submit"
                className="sm:col-span-3 inline-flex items-center justify-center gap-1 px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </form>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
              {regioes.map((reg) => (
                <div
                  key={reg.id}
                  className="p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{reg.nome}</div>
                    <div className="font-mono tabular-nums text-amber-700 font-bold">
                      {formatCurrency(reg.taxa)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        atualizarRegiaoEntrega(reg.id, { ativo: !reg.ativo })
                      }
                      className={`px-2.5 py-1 rounded font-medium ${
                        reg.ativo
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {reg.ativo ? 'Ativa' : 'Inativa'}
                    </button>
                    {ehAdmin && (
                      <button
                        onClick={() => excluirRegiaoEntrega(reg.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
