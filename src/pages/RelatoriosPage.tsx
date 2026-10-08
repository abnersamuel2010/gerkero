import React, { useState, useMemo } from 'react';
import {
  Printer,
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react';
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

  // 1. Dados para Gráfico de Distribuição por Tamanho de Marmitas (P, M, G)
  const dadosTamanhosMarmita = useMemo(() => {
    let countP = 0,
      valorP = 0;
    let countM = 0,
      valorM = 0;
    let countG = 0,
      valorG = 0;

    for (const item of itensPedidoPeriodo) {
      const nomeNorm = (
        item.nome +
        ' ' +
        (item.tamanhoMarmita || '')
      ).toLowerCase();
      if (nomeNorm.includes('pequena') || item.tamanhoMarmita === 'Pequena') {
        countP += item.quantidade;
        valorP += item.total;
      } else if (
        nomeNorm.includes('grande') ||
        item.tamanhoMarmita === 'Grande'
      ) {
        countG += item.quantidade;
        valorG += item.total;
      } else if (
        nomeNorm.includes('média') ||
        nomeNorm.includes('media') ||
        item.tamanhoMarmita === 'Média'
      ) {
        countM += item.quantidade;
        valorM += item.total;
      }
    }

    const totalQtd = countP + countM + countG || 1;
    return {
      pequena: {
        count: countP,
        valor: valorP,
        pct: Math.round((countP / totalQtd) * 100),
      },
      media: {
        count: countM,
        valor: valorM,
        pct: Math.round((countM / totalQtd) * 100),
      },
      grande: {
        count: countG,
        valor: valorG,
        pct: Math.round((countG / totalQtd) * 100),
      },
      totalContagem: countP + countM + countG,
      totalValor: valorP + valorM + valorG,
    };
  }, [itensPedidoPeriodo]);

  // 2. Ranking de Produtos e Carnes Mais Vendidos
  const topProdutosRanking = useMemo(() => {
    const mapQtd: Record<
      string,
      {
        nome: string;
        quantidade: number;
        total: number;
        categoria?: string;
      }
    > = {};

    for (const item of itensPedidoPeriodo) {
      const chave = item.nome.trim();
      if (!mapQtd[chave]) {
        mapQtd[chave] = {
          nome: chave,
          quantidade: 0,
          total: 0,
          categoria: item.tipo,
        };
      }
      mapQtd[chave].quantidade += item.quantidade;
      mapQtd[chave].total += item.total;
    }

    for (const item of itensComandaPeriodo) {
      const chave = item.produtoNome.trim();
      if (!mapQtd[chave]) {
        mapQtd[chave] = {
          nome: chave,
          quantidade: 0,
          total: 0,
          categoria: item.categoria,
        };
      }
      mapQtd[chave].quantidade += item.quantidade;
      mapQtd[chave].total += item.total;
    }

    return Object.values(mapQtd)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 6);
  }, [itensPedidoPeriodo, itensComandaPeriodo]);

  // 3. Distribuição por Faixa Horária (Horários de Pico da Cozinha)
  const horariosPico = useMemo(() => {
    let manha = 0; // 08h às 10h59
    let almoco = 0; // 11h às 14h
    let tarde = 0; // 14h01 às 17h59
    let noite = 0; // 18h às 23h

    for (const p of pedidosValidos) {
      const hora = new Date(p.criadoEm).getHours();
      if (hora >= 8 && hora < 11) manha++;
      else if (hora >= 11 && hora <= 14) almoco++;
      else if (hora > 14 && hora < 18) tarde++;
      else noite++;
    }

    const total = pedidosValidos.length || 1;
    return [
      {
        faixa: '08h - 11h',
        label: 'Abertura & Manhã',
        qtd: manha,
        pct: Math.round((manha / total) * 100),
        cor: 'bg-amber-400',
      },
      {
        faixa: '11h - 14h',
        label: 'Almoço (Pico Principal)',
        qtd: almoco,
        pct: Math.round((almoco / total) * 100),
        cor: 'bg-emerald-500',
      },
      {
        faixa: '14h - 18h',
        label: 'Período da Tarde',
        qtd: tarde,
        pct: Math.round((tarde / total) * 100),
        cor: 'bg-blue-400',
      },
      {
        faixa: '18h - 22h',
        label: 'Jantar & Noite',
        qtd: noite,
        pct: Math.round((noite / total) * 100),
        cor: 'bg-purple-500',
      },
    ];
  }, [pedidosValidos]);

  // 4. Canais de Venda
  const canaisVenda = useMemo(() => {
    const delivery = pedidosValidos
      .filter((p) => p.origem === 'delivery')
      .reduce((a, b) => a + b.total, 0);
    const balcao = pedidosValidos
      .filter((p) => p.origem === 'marmita' || p.origem === 'balcao')
      .reduce((a, b) => a + b.total, 0);
    const sala = receitaComandas;
    const total = Math.max(1, delivery + balcao + sala);

    return [
      {
        canal: 'Delivery em Domicílio',
        valor: delivery,
        pct: Math.round((delivery / total) * 100),
        cor: 'bg-amber-500',
      },
      {
        canal: 'Marmitas & Balcão',
        valor: balcao,
        pct: Math.round((balcao / total) * 100),
        cor: 'bg-emerald-500',
      },
      {
        canal: 'Buffet & Mesas Salão',
        valor: sala,
        pct: Math.round((sala / total) * 100),
        cor: 'bg-blue-500',
      },
    ];
  }, [pedidosValidos, receitaComandas]);

  // 5. Evolução Temporal de Vendas (Barras por Período)
  const evolucaoVendas = useMemo(() => {
    const mapDias: Record<
      string,
      { dataStr: string; label: string; valor: number; qtd: number }
    > = {};

    for (const p of pedidosValidos) {
      const diaKey = p.criadoEm.slice(0, 10);
      if (!mapDias[diaKey]) {
        const d = new Date(p.criadoEm);
        const diaNum = d.getDate().toString().padStart(2, '0');
        const mesNum = (d.getMonth() + 1).toString().padStart(2, '0');
        mapDias[diaKey] = {
          dataStr: diaKey,
          label: `${diaNum}/${mesNum}`,
          valor: 0,
          qtd: 0,
        };
      }
      mapDias[diaKey].valor += p.total;
      mapDias[diaKey].qtd += 1;
    }

    const sorted = Object.values(mapDias).sort((a, b) =>
      a.dataStr.localeCompare(b.dataStr)
    );
    if (sorted.length === 0) {
      return [
        { label: 'Hoje', valor: faturamentoTotal, qtd: quantidadeVendas },
      ];
    }
    return sorted.slice(-7);
  }, [pedidosValidos, faturamentoTotal, quantidadeVendas]);

  const maxEvolucaoValor = Math.max(
    1,
    ...evolucaoVendas.map((e) => e.valor)
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

      {/* SEÇÃO DE GRÁFICOS ANALÍTICOS PARA MELHOR INTERFACE */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-900 font-display">
            Painel Visual de Gráficos & Estatísticas
          </h2>
          <span className="text-xs text-slate-500">
            Interface gráfica intuitiva de apoio à decisão gerencial
          </span>
        </div>

        {/* Linha 1: Evolução Temporal + Distribuição por Tamanho de Marmitas */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Gráfico 1: Evolução Temporal de Vendas (Barras Interativas) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Evolução do Faturamento no Período
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Total: {formatCurrency(faturamentoTotal)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Volume de faturamento e quantidade de pedidos por dia/data
              </p>
            </div>

            {/* Visualização em Barras Verticais */}
            <div className="pt-4">
              <div className="h-48 flex items-end gap-2 sm:gap-4 border-b border-slate-200 pb-2 px-2">
                {evolucaoVendas.map((dia, idx) => {
                  const alturaPct = Math.max(
                    8,
                    Math.round((dia.valor / maxEvolucaoValor) * 100)
                  );
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative"
                    >
                      {/* Tooltip flutuante */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 pointer-events-none whitespace-nowrap shadow-lg z-10">
                        <div className="font-bold">{formatCurrency(dia.valor)}</div>
                        <div className="text-slate-400">{dia.qtd} pedidos</div>
                      </div>

                      <div className="text-[10px] font-mono font-bold text-slate-700 hidden sm:block truncate max-w-[60px]">
                        {dia.valor > 0 ? `R$${Math.round(dia.valor)}` : ''}
                      </div>

                      <div
                        className="w-full bg-gradient-to-t from-amber-600 to-amber-400 hover:from-amber-700 hover:to-amber-500 rounded-t-lg transition-all duration-300 shadow-xs cursor-pointer"
                        style={{ height: `${alturaPct}%` }}
                      />

                      <div className="text-[10px] font-medium text-slate-500 font-mono mt-1">
                        {dia.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>{evolucaoVendas.length} intervalos analisados</span>
              <span className="font-semibold text-slate-700">
                Média: {formatCurrency(ticketMedio)} por venda
              </span>
            </div>
          </div>

          {/* Gráfico 2: Distribuição por Tamanho de Marmitas (Donut SVG) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Marmitas por Tamanho (P, M, G)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {marmitasVendidasQtd} marmitas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Proporção de preferências entre Pequena, Média e Grande
              </p>
            </div>

            {/* Representação Donut Circular SVG */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {/* Círculo base cinza */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="3.8"
                  />
                  {/* Pequena (Azul) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.8"
                    strokeDasharray={`${dadosTamanhosMarmita.pequena.pct} ${
                      100 - dadosTamanhosMarmita.pequena.pct
                    }`}
                    strokeDashoffset="0"
                  />
                  {/* Média (Âmbar/Laranja) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.8"
                    strokeDasharray={`${dadosTamanhosMarmita.media.pct} ${
                      100 - dadosTamanhosMarmita.media.pct
                    }`}
                    strokeDashoffset={`${-dadosTamanhosMarmita.pequena.pct}`}
                  />
                  {/* Grande (Esmeralda) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.8"
                    strokeDasharray={`${dadosTamanhosMarmita.grande.pct} ${
                      100 - dadosTamanhosMarmita.grande.pct
                    }`}
                    strokeDashoffset={`${-(
                      dadosTamanhosMarmita.pequena.pct +
                      dadosTamanhosMarmita.media.pct
                    )}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold font-mono text-slate-900">
                    {dadosTamanhosMarmita.totalContagem}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                    Unidades
                  </span>
                </div>
              </div>
            </div>

            {/* Legenda Detalhada */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="font-semibold text-slate-700">Marmita Pequena (1 Carne)</span>
                </div>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {dadosTamanhosMarmita.pequena.count} un ({dadosTamanhosMarmita.pequena.pct}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-700">Marmita Média (Até 2 Carnes)</span>
                </div>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {dadosTamanhosMarmita.media.count} un ({dadosTamanhosMarmita.media.pct}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-700">Marmita Grande (Até 2 Carnes)</span>
                </div>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {dadosTamanhosMarmita.grande.count} un ({dadosTamanhosMarmita.grande.pct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Linha 2: Ranking Top Carnes/Produtos + Horários de Pico */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Gráfico 3: Ranking de Produtos & Carnes Mais Vendidos */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Top Carnes & Produtos Mais Vendidos
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Por volume e preferência dos clientes
              </span>
            </div>

            {topProdutosRanking.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Nenhum produto individual computado no período selecionado.
              </div>
            ) : (
              <div className="space-y-3">
                {topProdutosRanking.map((prod, idx) => {
                  const maxRankingQtd = topProdutosRanking[0]?.quantidade || 1;
                  const pct = Math.round((prod.quantidade / maxRankingQtd) * 100);
                  const medalhas = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate max-w-xs sm:max-w-md">
                          <span className="text-xs font-bold text-slate-600 w-5">
                            {idx < 3 ? medalhas[idx] : `${idx + 1}º`}
                          </span>
                          <span className="font-bold text-slate-800 truncate">
                            {prod.nome}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                          <span className="text-slate-600 font-semibold">
                            {prod.quantidade} un.
                          </span>
                          <span className="text-emerald-700 font-bold">
                            {formatCurrency(prod.total)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gráfico 4: Horários de Pico da Cozinha */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Distribuição por Horário (Picos da Cozinha)
                  </h3>
                </div>
                <span className="text-xs text-slate-500">Em tempo real</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Faixas horárias de maior concentração de saída de pedidos
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              {horariosPico.map((hp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {hp.faixa} — {hp.label}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {hp.qtd} pedidos ({hp.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${hp.cor}`}
                      style={{ width: `${Math.max(4, hp.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Horário Central:</strong> A faixa das 11h às 14h concentra a maior demanda de marmitas e buffet.
              </span>
            </div>
          </div>
        </div>

        {/* Linha 3: Canais de Venda e Formas de Pagamento */}
        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Gráfico 5: Desempenho por Canais de Venda */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Comparativo por Canais de Venda
              </h3>
            </div>

            <div className="space-y-3">
              {canaisVenda.map((cv, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>{cv.canal}</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(cv.valor)} ({cv.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${cv.cor}`}
                      style={{ width: `${Math.max(3, cv.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico 6: Desempenho por Forma de Pagamento */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Desempenho por Formas de Pagamento
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
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
                <div key={fp.label} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="font-semibold">{fp.label}</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(fp.valor)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
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
      </div>
    </div>
  );
};
