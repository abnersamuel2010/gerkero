import React, { useState } from 'react';
import { Plus, Trash2, Printer, CheckCircle2, Calendar, AlertTriangle, Check, Coffee, Cookie, Salad, ShoppingBag } from 'lucide-react';
import {
  Produto,
  ConfiguracaoRestaurante,
  FormaPagamento,
  Pedido,
  ThermalReceiptData,
} from '../types';
import {
  criarPedidoCompleto,
  NovoItemPedidoInput,
} from '../services/pedidosService';
import {
  formatCurrency,
  formatDateTime,
  formatFormaPagamento,
} from '../utils/formatters';
import { DIAS_DA_SEMANA, getDiaHojeKey } from '../data/cardapioOficial';

interface MarmitasPageProps {
  produtos: Produto[];
  config: ConfiguracaoRestaurante;
  pedidos: Pedido[];
  onPrintReceipt: (receipt: ThermalReceiptData) => void;
}

export const MarmitasPage: React.FC<MarmitasPageProps> = ({
  produtos,
  config,
  pedidos,
  onPrintReceipt,
}) => {
  const [diaSemana, setDiaSemana] = useState<
    'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado'
  >(getDiaHojeKey());
  const [tamanho, setTamanho] = useState<'Pequena' | 'Média' | 'Grande'>('Média');
  const [carnesSelecionadasIds, setCarnesSelecionadasIds] = useState<string[]>([]);
  const [avisoCarnes, setAvisoCarnes] = useState<string>('');
  const [acompanhamentosSelecionados, setAcompanhamentosSelecionados] = useState<string[]>([
    'Arroz',
    'Feijão',
    'Farofa',
  ]);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<string[]>([]);
  const [bebidaId, setBebidaId] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacaoItem, setObservacaoItem] = useState<string>('');

  const [carrinho, setCarrinho] = useState<NovoItemPedidoInput[]>([]);
  const [abaCriacao, setAbaCriacao] = useState<'marmita' | 'produtos'>('marmita');
  const [qtdProdutosAvulsos, setQtdProdutosAvulsos] = useState<Record<string, number>>({});
  const [clienteNome, setClienteNome] = useState<string>('Cliente Balcão');
  const [clienteTelefone, setClienteTelefone] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [trocoPara, setTrocoPara] = useState<string>('');
  const [observacaoPedido, setObservacaoPedido] = useState<string>('');
  const [finalizando, setFinalizando] = useState(false);
  const [ultimoPedidoCriado, setUltimoPedidoCriado] = useState<number | null>(null);

  // Filtrar apenas produtos ativos e disponíveis no dia
  const disponiveis = produtos.filter((p) => p.ativo && p.disponivel);
  const carnesLista = disponiveis.filter(
    (p) => p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais'
  );

  // Carnes filtradas pela escala do dia da semana
  const carnesDoDia = carnesLista.filter(
    (c) => !c.diasSemana || c.diasSemana.length === 0 || c.diasSemana.includes(diaSemana)
  );

  const carnesNormaisDoDia = carnesDoDia.filter(
    (c) => !c.ehEspecial && !c.exigeSegundaCarne
  );
  const carnesEspeciaisDoDia = carnesDoDia.filter(
    (c) => c.ehEspecial || c.exigeSegundaCarne
  );

  const acompanhamentosLista = disponiveis.filter(
    (p) => p.categoria === 'Acompanhamentos'
  );
  const adicionaisLista = disponiveis.filter((p) => p.categoria === 'Adicionais');
  const bebidasLista = disponiveis.filter((p) => p.categoria === 'Bebidas');
  const sobremesasLista = disponiveis.filter(
    (p) =>
      p.categoria === 'Doces e Sobremesas' ||
      p.nome.toLowerCase().includes('doce') ||
      p.nome.toLowerCase().includes('pudim') ||
      p.nome.toLowerCase().includes('trufa') ||
      p.nome.toLowerCase().includes('paçoca') ||
      p.nome.toLowerCase().includes('canudo') ||
      (p.categoria === 'Outros' && p.preco > 0)
  );
  const saladasAvulsasLista = disponiveis.filter(
    (p) =>
      p.categoria === 'Saladas Avulsas' ||
      (p.categoria === 'Porções' && p.nome.toLowerCase().includes('salada')) ||
      p.nome.toLowerCase().includes('salada')
  );

  const handleAdicionarProdutoAvulso = (prod: Produto) => {
    const qtd = Math.max(1, qtdProdutosAvulsos[prod.id] || 1);
    const novoItem: NovoItemPedidoInput = {
      tipo: 'produto',
      nome: prod.nome,
      quantidade: qtd,
      valorUnitario: prod.preco,
    };
    setCarrinho((prev) => [...prev, novoItem]);
    // reset da quantidade desse produto
    setQtdProdutosAvulsos((prev) => ({ ...prev, [prod.id]: 1 }));
  };

  const obterPrecoBaseTamanho = (tam: 'Pequena' | 'Média' | 'Grande'): number => {
    if (tam === 'Pequena') return config.precoMarmitaP || 16;
    if (tam === 'Média') return config.precoMarmitaM || 20;
    return config.precoMarmitaG || 25;
  };

  const carnesSelecionadasObjs = carnesSelecionadasIds
    .map((id) => carnesLista.find((c) => c.id === id))
    .filter(Boolean) as Produto[];

  const temEspecial = carnesSelecionadasObjs.some(
    (c) => c.ehEspecial || c.exigeSegundaCarne
  );
  const temDuasCarnesNormais =
    !temEspecial && carnesSelecionadasObjs.length === 2;
  const adicionalDuasCarnesNormais = temDuasCarnesNormais ? 2.0 : 0;

  const valorExtrasCarnes =
    carnesSelecionadasObjs.reduce((acc, c) => acc + (c.preco || 0), 0) +
    adicionalDuasCarnesNormais;

  const bebidaObj = bebidasLista.find((b) => b.id === bebidaId);
  const valorAdicionais = adicionaisSelecionados.reduce((acc, id) => {
    const ad = adicionaisLista.find((a) => a.id === id);
    return acc + (ad?.preco || 0);
  }, 0);
  const valorBebida = bebidaObj?.preco || 0;

  const precoUnitarioMarmita =
    obterPrecoBaseTamanho(tamanho) +
    valorExtrasCarnes +
    valorAdicionais +
    valorBebida;

  const handleMudarTamanho = (novoTam: 'Pequena' | 'Média' | 'Grande') => {
    setTamanho(novoTam);
    setAvisoCarnes('');
    if (novoTam === 'Pequena') {
      // Pequena só aceita 1 carne normal
      setCarnesSelecionadasIds((prev) => {
        const normais = prev.filter((id) => {
          const c = carnesLista.find((item) => item.id === id);
          return c && !c.ehEspecial && !c.exigeSegundaCarne;
        });
        return normais.slice(0, 1);
      });
    }
  };

  const toggleCarne = (carne: Produto) => {
    setAvisoCarnes('');
    const jaSelecionada = carnesSelecionadasIds.includes(carne.id);

    if (jaSelecionada) {
      setCarnesSelecionadasIds((prev) => prev.filter((id) => id !== carne.id));
      return;
    }

    const ehEstaEspecial = carne.ehEspecial || carne.exigeSegundaCarne;

    // 1. Regra Marmita Pequena: apenas 1 carne e NÃO aceita especial
    if (tamanho === 'Pequena') {
      if (ehEstaEspecial) {
        alert('Carnes especiais (Feijoada / Costela) só podem ser escolhidas na Marmita Média ou Grande.');
        return;
      }
      if (carnesSelecionadasIds.length >= 1) {
        alert('A Marmita Pequena permite apenas 1 carne. Para escolher 2 carnes ou carnes especiais, selecione a Marmita Média ou Grande.');
        return;
      }
      setCarnesSelecionadasIds([carne.id]);
      return;
    }

    // 2. Regra Marmita Média ou Grande: máximo 2 carnes
    if (carnesSelecionadasIds.length >= 2) {
      alert('Limite atingido! É permitido escolher no máximo 2 carnes por marmita.');
      return;
    }

    // 3. Regra: Não se pode colocar duas carnes especiais na mesma marmita
    if (ehEstaEspecial && temEspecial) {
      alert('Não é permitido colocar duas carnes especiais na mesma marmita. Combine a carne especial com uma carne tradicional.');
      return;
    }

    // 4. Se está adicionando a segunda carne e ambas são normais:
    if (!ehEstaEspecial && carnesSelecionadasIds.length === 1 && !temEspecial) {
      setAvisoCarnes('Aviso: Adicional de R$ 2,00 aplicado para escolher duas carnes normais.');
    }

    setCarnesSelecionadasIds((prev) => [...prev, carne.id]);
  };

  const toggleAcompanhamento = (nomeAcomp: string) => {
    setAcompanhamentosSelecionados((prev) =>
      prev.includes(nomeAcomp)
        ? prev.filter((a) => a !== nomeAcomp)
        : [...prev, nomeAcomp]
    );
  };

  const toggleAdicional = (idAdic: string) => {
    setAdicionaisSelecionados((prev) =>
      prev.includes(idAdic) ? prev.filter((a) => a !== idAdic) : [...prev, idAdic]
    );
  };

  const handleAdicionarAoPedido = () => {
    if (carnesSelecionadasIds.length === 0) {
      alert('Por favor, selecione pelo menos uma carne para a marmita.');
      return;
    }

    const diaObj = DIAS_DA_SEMANA.find((d) => d.key === diaSemana);
    const carnesNomes = carnesSelecionadasObjs.map((c) => c.nome).join(' + ');
    const detalheCarnes = temDuasCarnesNormais
      ? ' (2 Carnes Normais: +R$ 2,00)'
      : temEspecial
      ? ' (Carne Especial)'
      : '';

    const adicNomes = adicionaisSelecionados
      .map((id) => adicionaisLista.find((a) => a.id === id)?.nome)
      .filter(Boolean)
      .join(', ');

    const novoItem: NovoItemPedidoInput = {
      tipo: 'marmita',
      nome: `Marmita ${tamanho} (${carnesNomes || 'Carne do Dia'}${detalheCarnes})`,
      tamanhoMarmita: tamanho,
      carnes: carnesNomes || 'Carne do Dia',
      acompanhamentos:
        acompanhamentosSelecionados.length > 0
          ? acompanhamentosSelecionados.join(', ')
          : 'Arroz, Feijão e Farofa',
      adicionais: adicNomes || undefined,
      bebidas: bebidaObj?.nome || undefined,
      quantidade: Math.max(1, quantidade),
      valorUnitario: Number(precoUnitarioMarmita.toFixed(2)),
      observacao: observacaoItem.trim() || undefined,
    };

    setCarrinho((prev) => [...prev, novoItem]);
    setCarnesSelecionadasIds([]);
    setAvisoCarnes('');
    setAdicionaisSelecionados([]);
    setBebidaId('');
    setQuantidade(1);
    setObservacaoItem('');
  };

  const removerItemCarrinho = (idx: number) => {
    setCarrinho((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalCarrinho = carrinho.reduce(
    (acc, item) => acc + item.quantidade * item.valorUnitario,
    0
  );

  const proximoNumeroPedido =
    pedidos.length > 0
      ? Math.max(...pedidos.map((p) => p.numero || 100)) + 1
      : 101;

  const handleFinalizarPedidoMarmita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (carrinho.length === 0) return;
    setFinalizando(true);
    try {
      const numGerado = proximoNumeroPedido;
      const trocoNum =
        formaPagamento === 'dinheiro'
          ? parseFloat(trocoPara.replace(',', '.')) || 0
          : 0;

      await criarPedidoCompleto({
        numero: numGerado,
        origem: 'marmita',
        clienteNome: clienteNome.trim() || 'Cliente Balcão',
        clienteTelefone: clienteTelefone.trim() || undefined,
        formaPagamento,
        trocoPara: trocoNum > 0 ? trocoNum : undefined,
        observacoes: observacaoPedido.trim() || undefined,
        itens: carrinho,
        enviarParaCozinha: true,
      });

      setUltimoPedidoCriado(numGerado);

      // Abrir cupom térmico automaticamente
      onPrintReceipt({
        titulo: 'CUPOM DE MARMITA / COZINHA',
        numeroDocumento: `PEDIDO #${numGerado}`,
        dataHora: formatDateTime(new Date().toISOString()),
        clienteOuMesa: clienteNome || 'Cliente Balcão',
        telefone: clienteTelefone || undefined,
        linhas: carrinho.map((item) => ({
          qtd: item.quantidade,
          descricao: `${item.nome} - Carnes: ${item.carnes} | Acomp: ${item.acompanhamentos}${
            item.adicionais ? ` | Adic: ${item.adicionais}` : ''
          }${item.bebidas ? ` | Bebida: ${item.bebidas}` : ''}`,
          valor: item.quantidade * item.valorUnitario,
          observacao: item.observacao,
        })),
        subtotal: totalCarrinho,
        total: totalCarrinho,
        formaPagamento: formatFormaPagamento(formaPagamento),
        troco:
          trocoNum > totalCarrinho
            ? `Troco para ${formatCurrency(trocoNum)}: ${formatCurrency(
                trocoNum - totalCarrinho
              )}`
            : undefined,
        observacoesGerais: observacaoPedido || undefined,
      });

      setCarrinho([]);
      setObservacaoPedido('');
      setTrocoPara('');
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Venda e Montagem de Marmitas
          </h1>
          <p className="text-sm text-slate-600">
            Monte marmitas personalizadas (P, M ou G) com 1 ou 2 carnes, acompanhamentos, adicionais e bebidas
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-600">
          Próximo Pedido: <strong className="text-slate-900">#{proximoNumeroPedido}</strong>
        </div>
      </div>

      {ultimoPedidoCriado && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Pedido <strong>#{ultimoPedidoCriado}</strong> gerado com sucesso e enviado imediatamente para a Cozinha (KDS)!
            </span>
          </div>
          <button
            onClick={() => setUltimoPedidoCriado(null)}
            className="text-xs font-semibold underline"
          >
            Fechar aviso
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Montador de Marmita ou Produtos (7 colunas) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          {/* Navegação entre Montar Marmitas e Produtos Avulsos */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setAbaCriacao('marmita')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                abaCriacao === 'marmita'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              1. Montar Marmitas Personalizadas
            </button>
            <button
              type="button"
              onClick={() => setAbaCriacao('produtos')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                abaCriacao === 'produtos'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              2. Produtos (Bebidas, Sobremesas & Saladas)
            </button>
          </div>

          {abaCriacao === 'produtos' ? (
            /* SEÇÃO DE PRODUTOS AVULSOS EM TÓPICOS DIFERENTES */
            <div className="space-y-8">
              {/* Tópico A: Bebidas Geladas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-blue-600" />
                    🥤 Bebidas Geladas & Água Mineral
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {bebidasLista.length} itens disponíveis
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {bebidasLista.map((beb) => {
                    const qtd = qtdProdutosAvulsos[beb.id] || 1;
                    return (
                      <div
                        key={beb.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3 hover:border-amber-400/80 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {beb.nome}
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-700 whitespace-nowrap">
                              {formatCurrency(beb.preco)}
                            </span>
                          </div>
                          {beb.descricao && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {beb.descricao}
                            </p>
                          )}
                          {beb.estoque !== undefined && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              Estoque: {beb.estoque} un.
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setQtdProdutosAvulsos((prev) => ({
                                  ...prev,
                                  [beb.id]: Math.max(1, qtd - 1),
                                }))
                              }
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 py-1 font-mono font-semibold text-slate-900 min-w-[20px] text-center">
                              {qtd}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQtdProdutosAvulsos((prev) => ({
                                  ...prev,
                                  [beb.id]: qtd + 1,
                                }))
                              }
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdicionarProdutoAvulso(beb)}
                            className="flex-1 py-1.5 px-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tópico B: Doces e Sobremesas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Cookie className="w-4 h-4 text-pink-600" />
                    🍰 Doces & Sobremesas Artesanais
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {sobremesasLista.length} itens disponíveis
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {sobremesasLista.map((docItem) => {
                    const qtd = qtdProdutosAvulsos[docItem.id] || 1;
                    return (
                      <div
                        key={docItem.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3 hover:border-amber-400/80 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {docItem.nome}
                            </span>
                            <span className="text-xs font-mono font-bold text-pink-700 whitespace-nowrap">
                              {formatCurrency(docItem.preco)}
                            </span>
                          </div>
                          {docItem.descricao && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {docItem.descricao}
                            </p>
                          )}
                          {docItem.estoque !== undefined && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              Estoque: {docItem.estoque} un.
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setQtdProdutosAvulsos((prev) => ({
                                  ...prev,
                                  [docItem.id]: Math.max(1, qtd - 1),
                                }))
                              }
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 py-1 font-mono font-semibold text-slate-900 min-w-[20px] text-center">
                              {qtd}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQtdProdutosAvulsos((prev) => ({
                                  ...prev,
                                  [docItem.id]: qtd + 1,
                                }))
                              }
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdicionarProdutoAvulso(docItem)}
                            className="flex-1 py-1.5 px-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tópico C: Saladas Avulsas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Salad className="w-4 h-4 text-emerald-600" />
                    🥗 Saladas Avulsas & Frescas
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {saladasAvulsasLista.length} opções disponíveis
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {saladasAvulsasLista.map((sal) => {
                    const qtd = qtdProdutosAvulsos[sal.id] || 1;
                    return (
                      <div
                        key={sal.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3 hover:border-amber-400/80 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {sal.nome}
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-700 whitespace-nowrap">
                              {formatCurrency(sal.preco)}
                            </span>
                          </div>
                          {sal.descricao && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {sal.descricao}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setQtdProdutosAvulsos((prev) => ({
                                  ...prev,
                                  [sal.id]: Math.max(1, qtd - 1),
                                }))
                              }
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 py-1 font-mono font-semibold text-slate-900 min-w-[20px] text-center">
                              {qtd}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQtdProdutosAvulsos((prev) => ({
                                  ...prev,
                                  [sal.id]: qtd + 1,
                                }))
                              }
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdicionarProdutoAvulso(sal)}
                            className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* SEÇÃO DE MONTAGEM DE MARMITA PERSONALIZADA */
            <>
          {/* 1. Dia da Semana */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              1. Dia do Cardápio Semanal
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DIAS_DA_SEMANA.map((dia) => (
                <button
                  key={dia.key}
                  type="button"
                  onClick={() => {
                    setDiaSemana(dia.key);
                    setCarnesSelecionadasIds([]);
                    setAvisoCarnes('');
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-colors border ${
                    diaSemana === dia.key
                      ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                  }`}
                >
                  {dia.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tamanho */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-slate-800">
              2. Escolha o Tamanho da Marmita
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Pequena', 'Média', 'Grande'] as const).map((tam) => {
                const precoTam = obterPrecoBaseTamanho(tam);
                const selecionado = tamanho === tam;
                return (
                  <button
                    key={tam}
                    type="button"
                    onClick={() => handleMudarTamanho(tam)}
                    className={`p-3.5 rounded-xl border text-left transition-colors ${
                      selecionado
                        ? 'border-amber-600 bg-amber-50/70 text-slate-900 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold">{tam}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600">
                        {tam === 'Pequena' ? '1 Carne' : 'Até 2 Carnes'}
                      </span>
                    </div>
                    <div className="text-sm font-mono tabular-nums font-bold text-amber-700 mt-1">
                      {formatCurrency(precoTam)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Seleção de Carnes (Formato de cards, separado entre Tradicionais e Especiais) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Selecione a Carne ({DIAS_DA_SEMANA.find((d) => d.key === diaSemana)?.nomeCompleto})
                </label>
                <p className="text-[11px] text-slate-500">
                  {tamanho === 'Pequena'
                    ? 'Marmita Pequena: escolha apenas 1 carne tradicional (inclusa no valor).'
                    : 'Marmita Média/Grande: 1 carne inclusa. Se desejar 2 carnes normais, taxa de +R$ 2,00.'}
                </p>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {carnesSelecionadasIds.length} / {tamanho === 'Pequena' ? '1' : '2'} carnes
              </span>
            </div>

            {/* A. Carnes Tradicionais */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                🥩 Carnes Tradicionais do Dia:
              </span>
              <div className="grid sm:grid-cols-2 gap-2">
                {carnesNormaisDoDia.map((carne) => {
                  const marcado = carnesSelecionadasIds.includes(carne.id);
                  return (
                    <button
                      key={carne.id}
                      type="button"
                      onClick={() => toggleCarne(carne)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                        marcado
                          ? 'border-amber-600 bg-amber-50 text-slate-900 font-bold shadow-xs ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            marcado
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'border-slate-300 bg-slate-50'
                          }`}
                        >
                          {marcado && '✓'}
                        </div>
                        <span>{carne.nome}</span>
                      </div>
                      {carne.preco > 0 && (
                        <span className="text-[11px] text-amber-700 font-mono font-bold">
                          +{formatCurrency(carne.preco)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B. Carnes Especiais (Feijoada / Costela) */}
            {carnesEspeciaisDoDia.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    🔥 Carnes Especiais (Feijoada / Costela):
                  </span>
                  {tamanho === 'Pequena' && (
                    <span className="text-[10px] text-red-600 font-semibold">
                      * Indisponível na Pequena (requer Média ou Grande)
                    </span>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {carnesEspeciaisDoDia.map((carne) => {
                    const marcado = carnesSelecionadasIds.includes(carne.id);
                    const desabilitada =
                      tamanho === 'Pequena' || (temEspecial && !marcado);
                    return (
                      <button
                        key={carne.id}
                        type="button"
                        disabled={desabilitada}
                        onClick={() => toggleCarne(carne)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                          desabilitada
                            ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed text-slate-400'
                            : marcado
                            ? 'border-purple-600 bg-purple-50 text-slate-900 font-bold shadow-xs ring-1 ring-purple-500'
                            : 'border-purple-200 hover:border-purple-300 text-slate-800 bg-purple-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                              marcado
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-purple-300 bg-white'
                            }`}
                          >
                            {marcado && '✓'}
                          </div>
                          <span>{carne.nome}</span>
                        </div>
                        <span className="text-[10px] text-purple-700 font-semibold">
                          Especial
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alertas e Avisos de Regras */}
            {avisoCarnes && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{avisoCarnes}</span>
              </div>
            )}

            {temDuasCarnesNormais && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>2 Carnes Normais Selecionadas:</strong> Adicional de R$ 2,00 aplicado automaticamente no valor total da marmita.
                </span>
              </div>
            )}

            {temEspecial && carnesSelecionadasIds.length === 1 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  <strong>Carne Especial Selecionada:</strong> Você pode incluir uma segunda carne normal ou manter apenas esta carne especial.
                </span>
              </div>
            )}
          </div>

          {/* 5. Acompanhamentos */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              5. Acompanhamentos & Guarnições Diárias (Segunda a Sábado)
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {(acompanhamentosLista.length > 0
                ? acompanhamentosLista.map((a) => a.nome)
                : [
                    'Arroz',
                    'Feijão',
                    'Macarrão',
                    'Salada',
                    'Farofa',
                    'Batata',
                    'Legumes',
                  ]
              ).map((nomeAcomp) => {
                const marcado = acompanhamentosSelecionados.includes(nomeAcomp);
                return (
                  <label
                    key={nomeAcomp}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      marcado
                        ? 'border-amber-600 bg-amber-50/50 text-slate-900 font-medium'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => toggleAcompanhamento(nomeAcomp)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>{nomeAcomp}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 5. Adicionais */}
          {adicionaisLista.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-800">
                5. Adicionais Extras (Opcional)
              </label>
              <div className="grid sm:grid-cols-2 gap-2">
                {adicionaisLista.map((adic) => {
                  const marcado = adicionaisSelecionados.includes(adic.id);
                  return (
                    <label
                      key={adic.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        marcado
                          ? 'border-amber-600 bg-amber-50/50 text-slate-900 font-medium'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => toggleAdicional(adic.id)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span>{adic.nome}</span>
                      </span>
                      <span className="font-mono tabular-nums text-amber-700 font-semibold">
                        +{formatCurrency(adic.preco)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Bebida, Quantidade e Observação */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                6. Adicionar Bebida (Opcional)
              </label>
              <select
                value={bebidaId}
                onChange={(e) => setBebidaId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
              >
                <option value="">Sem bebida nesta marmita</option>
                {bebidasLista.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome} (+{formatCurrency(b.preco)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Quantidade
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Observações desta Marmita
            </label>
            <input
              type="text"
              value={observacaoItem}
              onChange={(e) => setObservacaoItem(e.target.value)}
              placeholder="Ex: Sem cebola, feijão separado, bem passado..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <div>
              <div className="text-xs text-slate-500">Valor unitário montado</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrency(precoUnitarioMarmita)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdicionarAoPedido}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Marmita ao Pedido
            </button>
          </div>
            </>
          )}
        </div>

        {/* Resumo e Fechamento do Pedido (5 colunas) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 font-display border-b border-slate-200 pb-3">
            Resumo do Pedido #{proximoNumeroPedido}
          </h2>

          {carrinho.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              Monte uma marmita ou selecione produtos ao lado para incluir no pedido.
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {carrinho.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        {item.tipo === 'marmita' ? 'Marmita' : 'Produto'}
                      </span>
                      {item.quantidade}x {item.nome}
                    </div>
                    {item.tipo === 'marmita' ? (
                      <>
                        <div className="text-slate-600">
                          <strong>Carnes:</strong> {item.carnes}
                        </div>
                        <div className="text-slate-600">
                          <strong>Acomp:</strong> {item.acompanhamentos}
                        </div>
                        {item.adicionais && (
                          <div className="text-slate-600">
                            <strong>Adicionais:</strong> {item.adicionais}
                          </div>
                        )}
                        {item.bebidas && (
                          <div className="text-slate-600">
                            <strong>Bebida:</strong> {item.bebidas}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-500 text-[11px]">
                        Item avulso adicionado ao pedido
                      </div>
                    )}
                    {item.observacao && (
                      <div className="text-amber-800">
                        <strong>Obs:</strong> {item.observacao}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="font-mono tabular-nums font-bold text-sm text-slate-900">
                      {formatCurrency(item.quantidade * item.valorUnitario)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerItemCarrinho(idx)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleFinalizarPedidoMarmita} className="space-y-4 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  required
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Telefone (Opcional)
                </label>
                <input
                  type="text"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
                >
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                </select>
              </div>

              {formaPagamento === 'dinheiro' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Troco para (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={trocoPara}
                    onChange={(e) => setTrocoPara(e.target.value)}
                    placeholder="Ex: 50.00"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:border-amber-600"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observações Gerais do Pedido
              </label>
              <input
                type="text"
                value={observacaoPedido}
                onChange={(e) => setObservacaoPedido(e.target.value)}
                placeholder="Ex: Retira no balcão às 12h30..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-300">Total do Pedido</span>
              <span className="text-xl font-bold font-mono tabular-nums">
                {formatCurrency(totalCarrinho)}
              </span>
            </div>

            <button
              type="submit"
              disabled={carrinho.length === 0 || finalizando}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {finalizando
                ? 'Gerando Pedido...'
                : `Confirmar Pedido #${proximoNumeroPedido} e Imprimir`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
