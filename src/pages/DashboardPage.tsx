import React, { useState } from 'react';
import { Share2, UtensilsCrossed, Trash2, AlertTriangle } from 'lucide-react';
import {
  Pedido,
  Mesa,
  Comanda,
  Pagamento,
  PedidoCozinha,
} from '../types';
import {
  formatCurrency,
  formatTimeOnly,
  formatFormaPagamento,
  formatStatusPedido,
  isToday,
} from '../utils/formatters';
import { NavigationTab } from '../components/Sidebar';
import { excluirPedidoDefinitivo } from '../services/pedidosService';

interface DashboardPageProps {
  pedidos: Pedido[];
  mesas: Mesa[];
  comandas: Comanda[];
  pagamentos: Pagamento[];
  pedidosCozinha: PedidoCozinha[];
  temDadosDemo: boolean;
  onNavigate: (tab: NavigationTab) => void;
  onOpenBancoModal: () => void;
  onIniciarBancoReal: () => void;
  onConverterDemoParaReal: () => void;
  onOpenLinkClienteModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  pedidos,
  mesas,
  comandas,
  pagamentos,
  pedidosCozinha,
  temDadosDemo,
  onNavigate,
  onOpenBancoModal,
  onIniciarBancoReal,
  onConverterDemoParaReal,
  onOpenLinkClienteModal,
}) => {
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

  // Filtrar dados do dia
  const pedidosHoje = pedidos.filter(
    (p) => isToday(p.criadoEm) && p.status !== 'cancelado'
  );
  const comandasFechadasHoje = comandas.filter(
    (c) => isToday(c.criadoEm) && c.status === 'fechada'
  );
  const pagamentosHoje = pagamentos.filter((pag) => isToday(pag.criadoEm));

  // Se houver pagamentos registrados hoje, usamos os pagamentos reais; caso contrário somamos pedidos + comandas do dia
  const totalDinheiro =
    pagamentosHoje.length > 0
      ? pagamentosHoje
          .filter((p) => p.formaPagamento === 'dinheiro')
          .reduce((acc, p) => acc + p.valor, 0)
      : pedidosHoje
          .filter((p) => p.formaPagamento === 'dinheiro')
          .reduce((acc, p) => acc + p.total, 0);

  const totalPix =
    pagamentosHoje.length > 0
      ? pagamentosHoje
          .filter((p) => p.formaPagamento === 'pix')
          .reduce((acc, p) => acc + p.valor, 0)
      : pedidosHoje
          .filter((p) => p.formaPagamento === 'pix')
          .reduce((acc, p) => acc + p.total, 0);

  const totalCartao =
    pagamentosHoje.length > 0
      ? pagamentosHoje
          .filter(
            (p) =>
              p.formaPagamento === 'cartao_debito' ||
              p.formaPagamento === 'cartao_credito'
          )
          .reduce((acc, p) => acc + p.valor, 0)
      : pedidosHoje
          .filter(
            (p) =>
              p.formaPagamento === 'cartao_debito' ||
              p.formaPagamento === 'cartao_credito'
          )
          .reduce((acc, p) => acc + p.total, 0);

  const faturamentoPedidosHoje = pedidosHoje.reduce((acc, p) => acc + p.total, 0);
  const faturamentoComandasHoje = comandasFechadasHoje.reduce(
    (acc, c) => acc + c.total,
    0
  );
  const faturamentoPagamentosHoje = pagamentosHoje.reduce(
    (acc, p) => acc + p.valor,
    0
  );

  const faturamentoDoDia = Math.max(
    faturamentoPagamentosHoje,
    faturamentoPedidosHoje + faturamentoComandasHoje
  );

  const numeroPedidosHoje = pedidosHoje.length + comandasFechadasHoje.length;

  const marmitasVendidasHoje = pedidosHoje.reduce((acc, p) => {
    if (p.qtdMarmitas && p.qtdMarmitas > 0) return acc + p.qtdMarmitas;
    if (p.origem === 'marmita') return acc + 1;
    return acc;
  }, 0);

  const mesasOcupadas = mesas.filter((m) => m.status !== 'livre').length;
  const mesasLivres = mesas.filter((m) => m.status === 'livre').length;

  const pedidosEmPreparo =
    pedidos.filter((p) => p.status === 'em_preparo' || p.status === 'confirmando')
      .length ||
    pedidosCozinha.filter((k) => k.status === 'novo' || k.status === 'em_preparo')
      .length;

  const pedidosAguardandoEntrega = pedidos.filter(
    (p) =>
      p.origem === 'delivery' &&
      (p.status === 'pronto' || p.status === 'saiu_para_entrega')
  ).length;

  // Dados para gráfico de barras por canal
  const vendasDelivery = pedidosHoje
    .filter((p) => p.origem === 'delivery')
    .reduce((acc, p) => acc + p.total, 0);
  const vendasMarmitaBalcao = pedidosHoje
    .filter((p) => p.origem === 'marmita' || p.origem === 'balcao')
    .reduce((acc, p) => acc + p.total, 0);
  const vendasMesas = comandas
    .filter((c) => isToday(c.criadoEm) && c.status !== 'cancelada')
    .reduce((acc, c) => acc + c.total, 0);

  const maxCanal = Math.max(
    1,
    vendasDelivery,
    vendasMarmitaBalcao,
    vendasMesas
  );

  const maxPagamento = Math.max(1, totalDinheiro, totalPix, totalCartao);

  const ultimosPedidos = [...pedidos]
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Cabeçalho Contextual */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Painel Operacional do Dia
          </h1>
          <p className="text-sm text-slate-600">
            Indicadores financeiros, produção da cozinha, mesas e entregas em tempo real no Cloud Firestore
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('marmitas')}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            + Nova Marmita
          </button>
          <button
            onClick={() => onNavigate('mesas')}
            className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Abrir Mesa / Comanda
          </button>
        </div>
      </div>

      {/* Banner de Pedidos Online para Clientes */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white font-display">
                Cardápio Online para Clientes (Link de Delivery)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ativo
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Envie o link do seu cardápio pelo WhatsApp ou redes sociais. O cliente monta seu pedido de entrega e ele aparece automaticamente no seu <strong>Painel Delivery (Kanban)</strong> e na <strong>Cozinha (KDS)</strong>!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
          {onOpenLinkClienteModal && (
            <button
              type="button"
              onClick={onOpenLinkClienteModal}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              Copiar Link & WhatsApp
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('delivery_cliente')}
            className="flex-1 md:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            Ver como Cliente
          </button>
        </div>
      </div>

      {mesas.length === 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
              <span>🚀</span> Iniciar Banco de Dados Real do Restaurante
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
              Seu banco de dados Cloud Firestore está conectado e pronto para uso oficial. Inicialize agora o cardápio oficial, as 12 mesas do salão, regiões de entrega e configurações reais sem nenhuma marcação de demonstração.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onIniciarBancoReal}
              className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              Iniciar Banco Real Oficial
            </button>
            <button
              onClick={onOpenBancoModal}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap"
            >
              Mais Opções de Inicialização
            </button>
          </div>
        </div>
      )}

      {temDadosDemo && mesas.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Aviso:</span>
            <span>O sistema possui itens marcados como demonstração ([Demo]). Deseja torná-los oficiais reais?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onConverterDemoParaReal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
            >
              Converter para Real Oficial
            </button>
            <button
              onClick={onOpenBancoModal}
              className="px-3 py-1.5 bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
            >
              Gerenciar Banco
            </button>
          </div>
        </div>
      )}

      {/* 10 Indicadores Principais Exigidos */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">Faturamento do Dia</div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(faturamentoDoDia)}
          </div>
          <div className="text-[11px] text-emerald-700">
            Atualizado em tempo real
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">Número de Pedidos</div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {numeroPedidosHoje}
          </div>
          <div className="text-[11px] text-slate-500">
            Pedidos + Comandas hoje
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">Marmitas Vendidas</div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {marmitasVendidasHoje}
          </div>
          <div className="text-[11px] text-slate-500">
            Unidades montadas hoje
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">Mesas Ocupadas</div>
          <div className="text-xl font-bold text-amber-600 font-mono tabular-nums">
            {mesasOcupadas}
          </div>
          <div className="text-[11px] text-slate-500">
            Em atendimento / reserva
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">Mesas Livres</div>
          <div className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
            {mesasLivres}
          </div>
          <div className="text-[11px] text-slate-500">
            Disponíveis no salão
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">Pedidos em Preparo</div>
          <div className="text-xl font-bold text-amber-600 font-mono tabular-nums">
            {pedidosEmPreparo}
          </div>
          <div className="text-[11px] text-slate-500">
            Na fila da Cozinha (KDS)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">Aguardando Entrega</div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {pedidosAguardandoEntrega}
          </div>
          <div className="text-[11px] text-slate-500">
            Prontos / Em rota delivery
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">Total em Dinheiro</div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalDinheiro)}
          </div>
          <div className="text-[11px] text-slate-500">
            Recebido em espécie
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">Total em Pix</div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalPix)}
          </div>
          <div className="text-[11px] text-slate-500">
            Transferências instantâneas
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs text-slate-500">Total em Cartão</div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalCartao)}
          </div>
          <div className="text-[11px] text-slate-500">
            Débito + Crédito
          </div>
        </div>
      </div>

      {/* Gráficos de Vendas */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Vendas por Canal */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Gráfico de Vendas por Canal (Hoje)
              </h2>
              <p className="text-xs text-slate-500">
                Distribuição de receita entre Delivery, Marmitaria/Balcão e Mesas/Buffet
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Delivery (Modelo iFood)</span>
                <span className="font-mono tabular-nums">{formatCurrency(vendasDelivery)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (vendasDelivery / maxCanal) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Venda de Marmitas & Balcão</span>
                <span className="font-mono tabular-nums">{formatCurrency(vendasMarmitaBalcao)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (vendasMarmitaBalcao / maxCanal) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Salão, Mesas & Buffet</span>
                <span className="font-mono tabular-nums">{formatCurrency(vendasMesas)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (vendasMesas / maxCanal) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Vendas por Forma de Pagamento */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Gráfico por Forma de Pagamento (Hoje)
            </h2>
            <p className="text-xs text-slate-500">
              Comparativo entre Dinheiro, Pix e Cartões (Débito/Crédito)
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Pix</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalPix)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalPix / maxPagamento) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Cartão (Débito e Crédito)</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalCartao)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalCartao / maxPagamento) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Dinheiro</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalDinheiro)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-700 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalDinheiro / maxPagamento) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Últimos Pedidos em Tempo Real */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Últimos Pedidos Registrados em Tempo Real
            </h2>
            <p className="text-xs text-slate-500">
              Sincronização automática via Cloud Firestore
            </p>
          </div>
          <button
            onClick={() => onNavigate('pedidos')}
            className="text-xs font-medium text-amber-700 hover:text-amber-800"
          >
            Ver todos os pedidos →
          </button>
        </div>

        {ultimosPedidos.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Nenhum pedido registrado ainda. Utilize &ldquo;Venda de Marmitas&rdquo; ou &ldquo;Delivery (Cliente iFood)&rdquo; para lançar um pedido.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Nº Pedido</th>
                  <th className="py-3 px-4">Horário</th>
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Resumo dos Itens</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {ultimosPedidos.map((ped) => (
                  <tr key={ped.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-900">
                      #{ped.numero}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500">
                      {formatTimeOnly(ped.criadoEm)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 capitalize">
                      {ped.origem}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {ped.clienteNome}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {ped.resumoItens || 'Itens diversos'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {formatFormaPagamento(ped.formaPagamento)}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">
                      {formatStatusPedido(ped.status)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(ped.total)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPedidoParaExcluir(ped)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                        title="Excluir pedido definitivamente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
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
                  Cliente: {pedidoParaExcluir.clienteNome} · Valor: {formatCurrency(pedidoParaExcluir.total)}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Tem certeza que deseja excluir este pedido permanentemente? Ele será removido do painel, da cozinha e do histórico de pedidos. Esta ação não pode ser desfeita.
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
