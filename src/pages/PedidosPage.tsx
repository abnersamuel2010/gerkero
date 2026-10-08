import React, { useState } from 'react';
import { Printer, Ban, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import {
  Pedido,
  PedidoStatus,
  ItemPedido,
  Caixa,
  ThermalReceiptData,
} from '../types';
import { atualizarStatusPedido, excluirPedidoDefinitivo } from '../services/pedidosService';
import {
  formatCurrency,
  formatDateTime,
  formatFormaPagamento,
  formatStatusPedido,
} from '../utils/formatters';

interface PedidosPageProps {
  pedidos: Pedido[];
  itensPedido: ItemPedido[];
  caixaAberto: Caixa | null;
  onPrintReceipt: (receipt: ThermalReceiptData) => void;
}

export const PedidosPage: React.FC<PedidosPageProps> = ({
  pedidos,
  itensPedido,
  caixaAberto,
  onPrintReceipt,
}) => {
  const [filtroOrigem, setFiltroOrigem] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState<Pedido | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const handleConfirmarExcluir = async () => {
    if (!pedidoParaExcluir) return;
    setExcluindo(true);
    try {
      await excluirPedidoDefinitivo(pedidoParaExcluir.id, pedidoParaExcluir.numero);
      setPedidoParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  };

  const pedidosFiltrados = [...pedidos]
    .filter((p) => {
      const okOrigem = filtroOrigem === 'todos' || p.origem === filtroOrigem;
      const okStatus = filtroStatus === 'todos' || p.status === filtroStatus;
      const okBusca =
        String(p.numero).includes(busca) ||
        p.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
        (p.resumoItens || '').toLowerCase().includes(busca.toLowerCase());
      return okOrigem && okStatus && okBusca;
    })
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  const imprimirPedido = (ped: Pedido) => {
    const itensDoPedido = itensPedido.filter((i) => i.pedidoId === ped.id);
    onPrintReceipt({
      titulo: `PEDIDO ${ped.origem.toUpperCase()}`,
      numeroDocumento: `PEDIDO #${ped.numero}`,
      dataHora: formatDateTime(ped.criadoEm),
      clienteOuMesa: ped.clienteNome,
      telefone: ped.clienteTelefone,
      endereco: ped.enderecoEntrega,
      linhas:
        itensDoPedido.length > 0
          ? itensDoPedido.map((it) => ({
              qtd: it.quantidade,
              descricao: `${it.nome}${it.carnes ? ` (${it.carnes})` : ''}${
                it.acompanhamentos ? ` [${it.acompanhamentos}]` : ''
              }`,
              valor: it.total,
              observacao: it.observacao,
            }))
          : [
              {
                qtd: 1,
                descricao: ped.resumoItens || 'Pedido',
                valor: ped.subtotal,
              },
            ],
      subtotal: ped.subtotal,
      taxaEntrega: ped.taxaEntrega,
      total: ped.total,
      formaPagamento: formatFormaPagamento(ped.formaPagamento),
      observacoesGerais: ped.observacoes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Central de Pedidos
          </h1>
          <p className="text-sm text-slate-600">
            Histórico e gerenciamento em tempo real de pedidos de Marmitas, Delivery e Balcão
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['todos', 'marmita', 'delivery', 'balcao'] as const).map((orig) => (
              <button
                key={orig}
                onClick={() => setFiltroOrigem(orig)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  filtroOrigem === orig
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {orig === 'todos' ? 'Todas Origens' : orig}
              </button>
            ))}
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="todos">Todos os Status</option>
            <option value="novo">Novo</option>
            <option value="confirmando">Confirmando</option>
            <option value="em_preparo">Em Preparo</option>
            <option value="pronto">Pronto</option>
            <option value="saiu_para_entrega">Saiu para Entrega</option>
            <option value="entregue">Entregue / Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por Nº pedido, cliente ou item..."
          className="px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg w-full lg:w-72"
        />
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {pedidosFiltrados.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Nenhum pedido encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Nº</th>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Cliente / Endereço</th>
                  <th className="py-3 px-4">Itens do Pedido</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Alterar Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {pedidosFiltrados.map((ped) => (
                  <tr key={ped.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900">
                      #{ped.numero}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(ped.criadoEm)}
                    </td>
                    <td className="py-3 px-4 text-xs capitalize text-slate-700">
                      {ped.origem}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {ped.clienteNome}
                      </div>
                      {ped.enderecoEntrega && (
                        <div className="text-xs text-slate-500 truncate max-w-xs">
                          {ped.enderecoEntrega}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-sm">
                      <div className="line-clamp-2">{ped.resumoItens}</div>
                      {ped.observacoes && (
                        <div className="text-amber-700 font-medium mt-0.5">
                          Obs: {ped.observacoes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      <div>{formatFormaPagamento(ped.formaPagamento)}</div>
                      <div className="text-[11px] text-slate-500">
                        {ped.pago ? 'Pago no Caixa' : 'Pendente'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={ped.status}
                        onChange={(e) =>
                          atualizarStatusPedido(
                            ped,
                            e.target.value as PedidoStatus,
                            caixaAberto
                          )
                        }
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
                      >
                        <option value="novo">
                          {formatStatusPedido('novo')}
                        </option>
                        <option value="confirmando">
                          {formatStatusPedido('confirmando')}
                        </option>
                        <option value="em_preparo">
                          {formatStatusPedido('em_preparo')}
                        </option>
                        <option value="pronto">
                          {formatStatusPedido('pronto')}
                        </option>
                        <option value="saiu_para_entrega">
                          {formatStatusPedido('saiu_para_entrega')}
                        </option>
                        <option value="entregue">
                          {formatStatusPedido('entregue')}
                        </option>
                        <option value="cancelado">
                          {formatStatusPedido('cancelado')}
                        </option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(ped.total)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => imprimirPedido(ped)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          title="Imprimir Cupom Térmico"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {ped.status !== 'entregue' && ped.status !== 'cancelado' && (
                          <button
                            onClick={() =>
                              atualizarStatusPedido(ped, 'entregue', caixaAberto)
                            }
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Concluir e Receber no Caixa"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {ped.status !== 'cancelado' && (
                          <button
                            onClick={() =>
                              atualizarStatusPedido(ped, 'cancelado', caixaAberto)
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Cancelar Pedido"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setPedidoParaExcluir(ped)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          title="Excluir Pedido Permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação para Excluir Pedido */}
      {pedidoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Excluir Pedido #{pedidoParaExcluir.numero}?
                </h3>
                <p className="text-xs text-slate-500">
                  Cliente: {pedidoParaExcluir.clienteNome} · Total: {formatCurrency(pedidoParaExcluir.total)}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Deseja realmente excluir este pedido do sistema? Ele será removido permanentemente da Central de Pedidos, da Cozinha (KDS) e dos relatórios operacionais.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={excluindo}
                onClick={() => setPedidoParaExcluir(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleConfirmarExcluir}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                {excluindo ? 'Excluindo...' : 'Sim, Excluir Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
