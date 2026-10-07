import React, { useState } from 'react';
import { Printer, BarChart3 } from 'lucide-react';
import {
  Pedido,
  ItemPedido,
  Comanda,
  ItemComanda,
  Pagamento,
  ThermalReceiptData,
} from '../types';
import {
  formatCurrency,
  formatDateTime,
  isWithinPeriod,
} from '../utils/formatters';

interface RelatoriosPageProps {
  pedidos: Pedido[];
  itensPedido: ItemPedido[];
  comandas: Comanda[];
  itensComanda: ItemComanda[];
  pagamentos: Pagamento[];
  onPrintReceipt: (receipt: ThermalReceiptData) => void;
}

type PeriodoFiltro =
  | 'hoje'
  | 'ontem'
  | '7dias'
  | 'mes_atual'
  | 'mes_anterior'
  | 'personalizado';

export const RelatoriosPage: React.FC<RelatoriosPageProps> = ({
  pedidos,
  itensPedido,
  comandas,
  itensComanda,
  pagamentos,
  onPrintReceipt,
}) => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('hoje');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const pedidosPeriodo = pedidos.filter((p) =>
    isWithinPeriod(p.criadoEm, periodo, dataInicio, dataFim)
  );
  const pedidosValidos = pedidosPeriodo.filter((p) => p.status !== 'cancelado');
  const pedidosCancelados = pedidosPeriodo.filter((p) => p.status === 'cancelado');

  const comandasPeriodo = comandas.filter((c) =>
    isWithinPeriod(c.criadoEm, periodo, dataInicio, dataFim)
  );
  const comandasValidas = comandasPeriodo.filter((c) => c.status !== 'cancelada');

  const pagamentosPeriodo = pagamentos.filter((pag) =>
    isWithinPeriod(pag.criadoEm, periodo, dataInicio, dataFim)
  );

  const receitaPedidos = pedidosValidos.reduce((acc, p) => acc + p.total, 0);
  const receitaComandas = comandasValidas.reduce((acc, c) => acc + c.total, 0);
  const faturamentoTotal = receitaPedidos + receitaComandas;

  const quantidadeVendas = pedidosValidos.length + comandasValidas.length;
  const ticketMedio =
    quantidadeVendas > 0 ? faturamentoTotal / quantidadeVendas : 0;

  const vendasDelivery = pedidosValidos
    .filter((p) => p.origem === 'delivery')
    .reduce((acc, p) => acc + p.total, 0);

  const taxasEntregaTotal = pedidosValidos.reduce(
    (acc, p) => acc + (p.taxaEntrega || 0),
    0
  );

  const vendasMesasTotal = receitaComandas;
  const vendasBuffetTotal = comandasValidas.reduce(
    (acc, c) => acc + (c.valorBuffetTotal || 0),
    0
  );

  const marmitasVendidasQtd = pedidosValidos.reduce((acc, p) => {
    if (p.qtdMarmitas && p.qtdMarmitas > 0) return acc + p.qtdMarmitas;
    if (p.origem === 'marmita') return acc + 1;
    return acc;
  }, 0);

  const itensPedidoPeriodo = itensPedido.filter((i) =>
    isWithinPeriod(i.criadoEm, periodo, dataInicio, dataFim)
  );
  const itensComandaPeriodo = itensComanda.filter((i) =>
    isWithinPeriod(i.criadoEm, periodo, dataInicio, dataFim)
  );

  const produtosVendidosQtd =
    itensPedidoPeriodo.reduce((acc, i) => acc + i.quantidade, 0) +
    itensComandaPeriodo.reduce((acc, i) => acc + i.quantidade, 0);

  // Formas de Pagamento no Período
  const pagDinheiro =
    pagamentosPeriodo.length > 0
      ? pagamentosPeriodo
          .filter((p) => p.formaPagamento === 'dinheiro')
          .reduce((a, b) => a + b.valor, 0)
      : pedidosValidos
          .filter((p) => p.formaPagamento === 'dinheiro')
          .reduce((a, b) => a + b.total, 0);

  const pagPix =
    pagamentosPeriodo.length > 0
      ? pagamentosPeriodo
          .filter((p) => p.formaPagamento === 'pix')
          .reduce((a, b) => a + b.valor, 0)
      : pedidosValidos
          .filter((p) => p.formaPagamento === 'pix')
          .reduce((a, b) => a + b.total, 0);

  const pagCartaoDebito =
    pagamentosPeriodo.length > 0
      ? pagamentosPeriodo
          .filter((p) => p.formaPagamento === 'cartao_debito')
          .reduce((a, b) => a + b.valor, 0)
      : pedidosValidos
          .filter((p) => p.formaPagamento === 'cartao_debito')
          .reduce((a, b) => a + b.total, 0);

  const pagCartaoCredito =
    pagamentosPeriodo.length > 0
      ? pagamentosPeriodo
          .filter((p) => p.formaPagamento === 'cartao_credito')
          .reduce((a, b) => a + b.valor, 0)
      : pedidosValidos
          .filter((p) => p.formaPagamento === 'cartao_credito')
          .reduce((a, b) => a + b.total, 0);

  const maxFormaPag = Math.max(
    1,
    pagDinheiro,
    pagPix,
    pagCartaoDebito,
    pagCartaoCredito
  );

  const handleImprimirRelatorio = () => {
    onPrintReceipt({
      titulo: 'RELATÓRIO GERENCIAL DE VENDAS',
      subtitulo: `Período: ${periodo.toUpperCase()}`,
      dataHora: formatDateTime(new Date().toISOString()),
      linhas: [
        { descricao: 'Faturamento Bruto', valor: faturamentoTotal },
        { descricao: `Quantidade de Vendas (${quantidadeVendas})` },
        { descricao: 'Ticket Médio', valor: ticketMedio },
        { descricao: `Produtos Vendidos (${produtosVendidosQtd} un.)` },
        { descricao: `Marmitas Vendidas (${marmitasVendidasQtd} un.)` },
        { descricao: 'Vendas do Buffet', valor: vendasBuffetTotal },
        { descricao: 'Vendas Delivery', valor: vendasDelivery },
        { descricao: 'Vendas das Mesas', valor: vendasMesasTotal },
        { descricao: 'Taxas de Entrega', valor: taxasEntregaTotal },
        { descricao: `Cancelamentos (${pedidosCancelados.length})` },
        { descricao: '--- FORMAS DE PAGAMENTO ---' },
        { descricao: 'Dinheiro', valor: pagDinheiro },
        { descricao: 'Pix', valor: pagPix },
        { descricao: 'Cartão Débito', valor: pagCartaoDebito },
        { descricao: 'Cartão Crédito', valor: pagCartaoCredito },
      ],
      total: faturamentoTotal,
      rodape: 'RELATÓRIO EMITIDO PELO SISTEMA SABOR & BRASA',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Relatórios Financeiros e Operacionais
          </h1>
          <p className="text-sm text-slate-600">
            Análise completa de faturamento, marmitas, buffet, delivery, ticket médio, taxas e cancelamentos
          </p>
        </div>

        <button
          onClick={handleImprimirRelatorio}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          <Printer className="w-4 h-4" />
          Imprimir Relatório (80mm)
        </button>
      </div>

      {/* Seletor de Período */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              { id: 'hoje', label: 'Hoje' },
              { id: 'ontem', label: 'Ontem' },
              { id: '7dias', label: 'Últimos 7 dias' },
              { id: 'mes_atual', label: 'Este mês' },
              { id: 'mes_anterior', label: 'Mês anterior' },
              { id: 'personalizado', label: 'Período personalizado' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriodo(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                periodo === item.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {periodo === 'personalizado' && (
          <div className="flex items-center gap-2 text-xs">
            <span>De:</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
            />
            <span>Até:</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* 11 Métricas Exigidas nos Relatórios */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">1. Faturamento Total</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(faturamentoTotal)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">2. Quantidade de Vendas</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {quantidadeVendas}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">3. Ticket Médio</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {formatCurrency(ticketMedio)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">4. Produtos Vendidos</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {produtosVendidosQtd}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">5. Marmitas Vendidas</div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-700">
            {marmitasVendidasQtd}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">6. Vendas do Buffet</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(vendasBuffetTotal)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">7. Vendas Delivery</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(vendasDelivery)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">8. Vendas das Mesas</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(vendasMesasTotal)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">9. Taxas de Entrega</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(taxasEntregaTotal)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">10. Cancelamentos</div>
          <div className="text-xl font-bold font-mono tabular-nums text-red-600">
            {pedidosCancelados.length}
          </div>
        </div>
      </div>

      {/* Gráfico de Formas de Pagamento no Período */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900 font-display">
            11. Desempenho por Forma de Pagamento no Período
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { label: 'Pix', valor: pagPix, cor: 'bg-emerald-600' },
            { label: 'Dinheiro', valor: pagDinheiro, cor: 'bg-slate-800' },
            {
              label: 'Cartão de Crédito',
              valor: pagCartaoCredito,
              cor: 'bg-amber-600',
            },
            {
              label: 'Cartão de Débito',
              valor: pagCartaoDebito,
              cor: 'bg-blue-600',
            },
          ].map((fp) => (
            <div key={fp.label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>{fp.label}</span>
                <span className="font-mono tabular-nums font-bold">
                  {formatCurrency(fp.valor)}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${fp.cor}`}
                  style={{
                    width: `${Math.min(100, (fp.valor / maxFormaPag) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
