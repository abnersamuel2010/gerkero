import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  ArrowRightLeft,
  Calculator,
  Printer,
  CheckCircle2,
  Utensils,
} from 'lucide-react';
import {
  Comanda,
  ItemComanda,
  Mesa,
  Produto,
  ConfiguracaoRestaurante,
  FormaPagamento,
  Caixa,
  ThermalReceiptData,
} from '../types';
import {
  adicionarItemComanda,
  alterarQuantidadeItemComanda,
  removerItemComanda,
  recalcularTotalComanda,
  transferirMesaComanda,
  transferirItemEntreComandas,
  fecharComandaEPagar,
} from '../services/comandasService';
import { atualizarStatusMesa } from '../services/mesasService';
import {
  formatCurrency,
  formatDateTime,
  formatFormaPagamento,
} from '../utils/formatters';

interface ComandasBuffetPageProps {
  comandas: Comanda[];
  itensComanda: ItemComanda[];
  mesas: Mesa[];
  produtos: Produto[];
  config: ConfiguracaoRestaurante;
  caixaAberto: Caixa | null;
  comandaSelecionadaId: string | null;
  onSelectComandaId: (id: string | null) => void;
  onPrintReceipt: (receipt: ThermalReceiptData) => void;
}

export const ComandasBuffetPage: React.FC<ComandasBuffetPageProps> = ({
  comandas,
  itensComanda,
  mesas,
  produtos,
  config,
  caixaAberto,
  comandaSelecionadaId,
  onSelectComandaId,
  onPrintReceipt,
}) => {
  const comandasAtivas = comandas.filter(
    (c) => c.status === 'aberta' || c.status === 'aguardando_pagamento'
  );

  const comandaAtual =
    comandasAtivas.find((c) => c.id === comandaSelecionadaId) ||
    comandasAtivas[0] ||
    null;

  const [produtoEscolhidoId, setProdutoEscolhidoId] = useState('');
  const [qtdNovoItem, setQtdNovoItem] = useState(1);
  const [obsNovoItem, setObsNovoItem] = useState('');

  // Buffet Editor
  const [pessoasBuffet, setPessoasBuffet] = useState<number>(2);
  const [tipoClienteBuffet, setTipoClienteBuffet] = useState<
    'adulto' | 'crianca' | 'personalizado' | 'sem_buffet'
  >('adulto');
  const [valorCustomBuffet, setValorCustomBuffet] = useState<string>('44.90');

  // Transferência de Mesa e Divisão de Conta
  const [mesaDestinoId, setMesaDestinoId] = useState('');
  const [dividirPorPessoas, setDividirPorPessoas] = useState(2);
  const [formaPagamentoFechamento, setFormaPagamentoFechamento] =
    useState<FormaPagamento>('pix');
  const [itemParaTransferir, setItemParaTransferir] = useState<ItemComanda | null>(
    null
  );
  const [comandaDestinoItemId, setComandaDestinoItemId] = useState('');

  const produtosDisponiveis = produtos.filter((p) => p.ativo && p.disponivel);
  const mesasLivres = mesas.filter((m) => m.status === 'livre');

  const itensDaComandaAtual = comandaAtual
    ? itensComanda.filter((i) => i.comandaId === comandaAtual.id)
    : [];

  const handleAdicionarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comandaAtual || !produtoEscolhidoId) return;
    const prod = produtosDisponiveis.find((p) => p.id === produtoEscolhidoId);
    if (!prod) return;

    await adicionarItemComanda({
      comanda: comandaAtual,
      itensAtuais: itensDaComandaAtual,
      produto: prod,
      quantidade: qtdNovoItem,
      observacao: obsNovoItem,
    });
    setQtdNovoItem(1);
    setObsNovoItem('');
  };

  const handleAplicarBuffet = async () => {
    if (!comandaAtual) return;
    let valorPorPessoa = 0;
    let labelTipo = 'Sem Buffet Fixo';

    if (tipoClienteBuffet === 'adulto') {
      valorPorPessoa = config.precoBuffetAdulto || 44.9;
      labelTipo = 'Buffet Adulto';
    } else if (tipoClienteBuffet === 'crianca') {
      valorPorPessoa = config.precoBuffetCrianca || 24.9;
      labelTipo = 'Buffet Infantil / Criança';
    } else if (tipoClienteBuffet === 'personalizado') {
      valorPorPessoa = parseFloat(valorCustomBuffet.replace(',', '.')) || 0;
      labelTipo = 'Buffet Especial';
    }

    await recalcularTotalComanda(comandaAtual, itensDaComandaAtual, {
      pessoas: Math.max(1, pessoasBuffet),
      tipoBuffet: labelTipo,
      valorPorPessoaBuffet: valorPorPessoa,
    });
  };

  const handleTransferirMesa = async () => {
    if (!comandaAtual || !mesaDestinoId) return;
    const mesaOrigem = mesas.find((m) => m.id === comandaAtual.mesaId);
    const mesaDestino = mesas.find((m) => m.id === mesaDestinoId);
    if (!mesaOrigem || !mesaDestino) return;

    await transferirMesaComanda(
      comandaAtual,
      mesaOrigem,
      mesaDestino,
      itensDaComandaAtual
    );
    setMesaDestinoId('');
  };

  const handleTransferirItem = async () => {
    if (!comandaAtual || !itemParaTransferir || !comandaDestinoItemId) return;
    const cmdDestino = comandasAtivas.find((c) => c.id === comandaDestinoItemId);
    if (!cmdDestino) return;
    const itensDestino = itensComanda.filter((i) => i.comandaId === cmdDestino.id);

    await transferirItemEntreComandas(
      itemParaTransferir,
      comandaAtual,
      itensDaComandaAtual,
      cmdDestino,
      itensDestino
    );
    setItemParaTransferir(null);
    setComandaDestinoItemId('');
  };

  const handlePedirConta = async () => {
    if (!comandaAtual) return;
    const mesaObj = mesas.find((m) => m.id === comandaAtual.mesaId);
    if (mesaObj) {
      await atualizarStatusMesa(
        mesaObj,
        'aguardando_pagamento',
        comandaAtual.pessoas,
        comandaAtual.id,
        ''
      );
    }
    handleImprimirComanda();
  };

  const handleImprimirComanda = () => {
    if (!comandaAtual) return;
    const linhasCupom: ThermalReceiptData['linhas'] = [];

    if ((comandaAtual.valorBuffetTotal || 0) > 0) {
      linhasCupom.push({
        qtd: comandaAtual.pessoas,
        descricao: `${comandaAtual.tipoBuffet || 'Buffet'} (${formatCurrency(
          comandaAtual.valorPorPessoaBuffet || 0
        )}/pessoa)`,
        valor: comandaAtual.valorBuffetTotal || 0,
      });
    }

    for (const item of itensDaComandaAtual) {
      linhasCupom.push({
        qtd: item.quantidade,
        descricao: item.produtoNome,
        valor: item.total,
        observacao: item.observacao,
      });
    }

    onPrintReceipt({
      titulo: 'EXTRATO DE COMANDA / CONTA DE MESA',
      numeroDocumento: `${comandaAtual.codigo} — MESA ${comandaAtual.mesaNumero}`,
      dataHora: formatDateTime(new Date().toISOString()),
      clienteOuMesa: `Mesa ${comandaAtual.mesaNumero} (${comandaAtual.pessoas} pessoas)`,
      linhas: linhasCupom,
      subtotal: comandaAtual.total,
      total: comandaAtual.total,
      observacoesGerais: `Valor dividido por ${dividirPorPessoas} pessoas: ${formatCurrency(
        comandaAtual.total / Math.max(1, dividirPorPessoas)
      )} por pessoa`,
    });
  };

  const handleFecharComanda = async () => {
    if (!comandaAtual) return;
    const mesaObj = mesas.find((m) => m.id === comandaAtual.mesaId);
    await fecharComandaEPagar(
      comandaAtual,
      mesaObj,
      formaPagamentoFechamento,
      caixaAberto
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 font-display">
          Comandas Digitais & Controle de Buffet
        </h1>
        <p className="text-sm text-slate-600">
          Lance buffet por pessoa (Adulto/Criança), adicione bebidas e porções, transfira mesas/itens, divida a conta e feche a comanda
        </p>
      </div>

      {comandasAtivas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <p className="text-sm text-slate-600">
            Nenhuma comanda aberta no momento. Acesse o <strong>Mapa de Mesas</strong> e clique em uma mesa livre para abrir uma comanda.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Lista de Comandas Abertas (3 colunas) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-700">
              Comandas Abertas ({comandasAtivas.length})
            </h2>
            <div className="space-y-2">
              {comandasAtivas.map((cmd) => {
                const selecionada = comandaAtual?.id === cmd.id;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => onSelectComandaId(cmd.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selecionada
                        ? 'border-amber-600 bg-amber-50/70'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        Mesa {String(cmd.mesaNumero).padStart(2, '0')}
                      </span>
                      <span className="font-mono tabular-nums text-xs text-slate-500">
                        {cmd.pessoas} pess.
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {cmd.codigo}
                    </div>
                    <div className="text-sm font-bold font-mono tabular-nums text-amber-700 mt-1">
                      {formatCurrency(cmd.total)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalhes da Comanda Selecionada (9 colunas) */}
          {comandaAtual && (
            <div className="lg:col-span-9 space-y-6">
              {/* Módulo de Buffet da Mesa */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-amber-600" />
                      Módulo de Buffet — Mesa {comandaAtual.mesaNumero} ({comandaAtual.codigo})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Cálculo automático: Quantidade de pessoas × valor por pessoa + produtos adicionais
                    </p>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <span className="text-xs text-slate-500">Subtotal Buffet: </span>
                    <strong className="text-sm text-slate-900">
                      {formatCurrency(comandaAtual.valorBuffetTotal || 0)}
                    </strong>
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nº de Pessoas
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={pessoasBuffet}
                      onChange={(e) =>
                        setPessoasBuffet(Math.max(1, Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Categoria do Buffet
                    </label>
                    <select
                      value={tipoClienteBuffet}
                      onChange={(e) =>
                        setTipoClienteBuffet(
                          e.target.value as
                            | 'adulto'
                            | 'crianca'
                            | 'personalizado'
                            | 'sem_buffet'
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="adulto">
                        Adulto ({formatCurrency(config.precoBuffetAdulto)})
                      </option>
                      <option value="crianca">
                        Criança ({formatCurrency(config.precoBuffetCrianca)})
                      </option>
                      <option value="personalizado">Valor Personalizado</option>
                      <option value="sem_buffet">Sem Buffet (R$ 0,00)</option>
                    </select>
                  </div>

                  {tipoClienteBuffet === 'personalizado' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Valor por Pessoa (R$)
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        value={valorCustomBuffet}
                        onChange={(e) => setValorCustomBuffet(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAplicarBuffet}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Atualizar Buffet na Comanda
                  </button>
                </div>
              </div>

              {/* Adicionar Produto à Comanda */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Adicionar Bebidas, Porções, Marmitas ou Adicionais
                </h3>

                <form
                  onSubmit={handleAdicionarItem}
                  className="grid sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Produto
                    </label>
                    <select
                      required
                      value={produtoEscolhidoId}
                      onChange={(e) => setProdutoEscolhidoId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">Escolha um item do cardápio...</option>
                      {produtosDisponiveis.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.categoria}] {p.nome} — {formatCurrency(p.preco)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Qtd
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={qtdNovoItem}
                      onChange={(e) =>
                        setQtdNovoItem(Math.max(1, Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Observação
                    </label>
                    <input
                      type="text"
                      value={obsNovoItem}
                      onChange={(e) => setObsNovoItem(e.target.value)}
                      placeholder="Com gelo e limão..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Lançar
                  </button>
                </form>

                {/* Lista de Itens Lançados */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-2.5 px-3">Produto / Observação</th>
                        <th className="py-2.5 px-3 text-center">Quantidade</th>
                        <th className="py-2.5 px-3 text-right">Unitário</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {(comandaAtual.valorBuffetTotal || 0) > 0 && (
                        <tr className="bg-amber-50/30">
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {comandaAtual.tipoBuffet || 'Buffet'} ({comandaAtual.pessoas} pessoas)
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                            {comandaAtual.pessoas}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {formatCurrency(comandaAtual.valorPorPessoaBuffet || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                            {formatCurrency(comandaAtual.valorBuffetTotal || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-xs text-slate-400">
                            Buffet
                          </td>
                        </tr>
                      )}

                      {itensDaComandaAtual.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-900">
                              {item.produtoNome}
                            </div>
                            {item.observacao && (
                              <div className="text-xs text-amber-700">
                                Obs: {item.observacao}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  alterarQuantidadeItemComanda(
                                    comandaAtual,
                                    item,
                                    item.quantidade - 1,
                                    itensDaComandaAtual
                                  )
                                }
                                className="p-1 bg-slate-100 hover:bg-slate-200 rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono tabular-nums font-semibold text-xs w-6 text-center">
                                {item.quantidade}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  alterarQuantidadeItemComanda(
                                    comandaAtual,
                                    item,
                                    item.quantidade + 1,
                                    itensDaComandaAtual
                                  )
                                }
                                className="p-1 bg-slate-100 hover:bg-slate-200 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs">
                            {formatCurrency(item.valorUnitario)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setItemParaTransferir(item)}
                              className="p-1.5 text-slate-500 hover:text-slate-900"
                              title="Transferir este item para outra mesa"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removerItemComanda(
                                  comandaAtual,
                                  item,
                                  itensDaComandaAtual
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Modal / Barra de Transferência de Item */}
                {itemParaTransferir && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span>
                      Transferir <strong>{itemParaTransferir.produtoNome}</strong> para outra comanda aberta:
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={comandaDestinoItemId}
                        onChange={(e) => setComandaDestinoItemId(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="">Selecione a mesa destino...</option>
                        {comandasAtivas
                          .filter((c) => c.id !== comandaAtual.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              Mesa {c.mesaNumero} ({c.codigo})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleTransferirItem}
                        className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemParaTransferir(null)}
                        className="px-2 py-1.5 text-slate-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Operações de Mesa: Transferir Mesa, Dividir Conta e Fechar Comanda */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-600" />
                    Dividir Conta & Transferir Mesa
                  </h3>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">
                        Dividir total entre quantas pessoas?
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={dividirPorPessoas}
                        onChange={(e) =>
                          setDividirPorPessoas(Math.max(1, Number(e.target.value)))
                        }
                        className="w-24 px-2.5 py-1 text-sm border border-slate-300 rounded bg-white font-mono tabular-nums"
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Valor por pessoa</div>
                      <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                        {formatCurrency(
                          comandaAtual.total / Math.max(1, dividirPorPessoas)
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <label className="block text-xs font-medium text-slate-700">
                      Transferir Comanda Inteira para outra Mesa Livre
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={mesaDestinoId}
                        onChange={(e) => setMesaDestinoId(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">Escolher mesa livre...</option>
                        {mesasLivres.map((m) => (
                          <option key={m.id} value={m.id}>
                            Mesa {m.numero} ({m.capacidade} lugares)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleTransferirMesa}
                        disabled={!mesaDestinoId}
                        className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg disabled:opacity-50 whitespace-nowrap"
                      >
                        Transferir Mesa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fechamento e Pagamento da Comanda */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Total Geral da Comanda:
                      </span>
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                        {formatCurrency(comandaAtual.total)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Forma de Pagamento no Fechamento
                      </label>
                      <select
                        value={formaPagamentoFechamento}
                        onChange={(e) =>
                          setFormaPagamentoFechamento(
                            e.target.value as FormaPagamento
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="pix">Pix</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handlePedirConta}
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Pré-Conta
                    </button>

                    <button
                      type="button"
                      onClick={handleFecharComanda}
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Fechar e Receber
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
