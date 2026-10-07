import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  MapPin,
  CheckCircle2,
  Utensils,
} from 'lucide-react';
import {
  Produto,
  RegiaoEntrega,
  ConfiguracaoRestaurante,
  FormaPagamento,
  Pedido,
} from '../types';
import {
  criarPedidoCompleto,
  NovoItemPedidoInput,
} from '../services/pedidosService';
import {
  formatCurrency,
  formatStatusPedido,
  formatTimeOnly,
} from '../utils/formatters';

interface DeliveryClientePageProps {
  produtos: Produto[];
  regioes: RegiaoEntrega[];
  config: ConfiguracaoRestaurante;
  pedidos: Pedido[];
}

export const DeliveryClientePage: React.FC<DeliveryClientePageProps> = ({
  produtos,
  regioes,
  config,
  pedidos,
}) => {
  const [abaCardapio, setAbaCardapio] = useState<'destaques' | 'montar_marmita' | 'bebidas'>('destaques');

  // Estado para montagem de marmita no Delivery
  const [tamMarmita, setTamMarmita] = useState<'Pequena' | 'Média' | 'Grande'>('Média');
  const [carneEscolhida, setCarneEscolhida] = useState('');
  const [carne2Escolhida, setCarne2Escolhida] = useState('');
  const [acompEscolhidos, setAcompEscolhidos] = useState<string[]>([]);
  const [obsMarmita, setObsMarmita] = useState('');

  // Carrinho e Dados do Cliente
  const [sacola, setSacola] = useState<NovoItemPedidoInput[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [enderecoCliente, setEnderecoCliente] = useState('');
  const [regiaoSelecionadaId, setRegiaoSelecionadaId] = useState<string>(
    regioes.find((r) => r.ativo)?.id || ''
  );
  const [formaPag, setFormaPag] = useState<FormaPagamento>('pix');
  const [precisaTrocoPara, setPrecisaTrocoPara] = useState('');
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidoConfirmadoId, setPedidoConfirmadoId] = useState<string | null>(null);

  const produtosDisponiveis = produtos.filter((p) => p.ativo && p.disponivel);
  const pratosEPorcoes = produtosDisponiveis.filter(
    (p) =>
      p.categoria === 'Marmitas' ||
      p.categoria === 'Porções' ||
      p.categoria === 'Outros'
  );
  const carnesDisponiveis = produtosDisponiveis.filter(
    (p) => p.categoria === 'Carnes' || p.categoria === 'Carnes Especiais'
  );
  const acompanhamentosDisponiveis = produtosDisponiveis.filter(
    (p) => p.categoria === 'Acompanhamentos'
  );
  const bebidasDisponiveis = produtosDisponiveis.filter(
    (p) => p.categoria === 'Bebidas'
  );

  const regioesAtivas = regioes.filter((r) => r.ativo);
  const regiaoObj =
    regioesAtivas.find((r) => r.id === regiaoSelecionadaId) || regioesAtivas[0];
  const taxaEntrega = regiaoObj ? regiaoObj.taxa : 0;

  const subtotalSacola = sacola.reduce(
    (acc, item) => acc + item.quantidade * item.valorUnitario,
    0
  );
  const totalComEntrega = subtotalSacola + (sacola.length > 0 ? taxaEntrega : 0);

  const adicionarProdutoPronto = (prod: Produto) => {
    setSacola((prev) => {
      const idx = prev.findIndex(
        (i) => i.nome === prod.nome && i.tipo === 'produto'
      );
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], quantidade: clone[idx].quantidade + 1 };
        return clone;
      }
      return [
        ...prev,
        {
          tipo: prod.categoria === 'Marmitas' ? 'marmita' : 'produto',
          nome: prod.nome,
          quantidade: 1,
          valorUnitario: prod.preco,
        },
      ];
    });
  };

  const precoBaseMarmita =
    tamMarmita === 'Pequena'
      ? config.precoMarmitaP || 20
      : tamMarmita === 'Média'
      ? config.precoMarmitaM || 25
      : config.precoMarmitaG || 30;

  const carne1Obj = carnesDisponiveis.find((c) => c.id === carneEscolhida);
  const carne2Obj = carnesDisponiveis.find((c) => c.id === carne2Escolhida);
  const precoMarmitaMontada =
    precoBaseMarmita + (carne1Obj?.preco || 0) + (carne2Obj?.preco || 0);

  const adicionarMarmitaMontadaNaSacola = () => {
    const carnesStr = [carne1Obj?.nome, carne2Obj?.nome]
      .filter(Boolean)
      .join(' + ');
    setSacola((prev) => [
      ...prev,
      {
        tipo: 'marmita',
        nome: `Marmita ${tamMarmita} Personalizada`,
        tamanhoMarmita: tamMarmita,
        carnes: carnesStr || 'Carne do Dia',
        acompanhamentos:
          acompEscolhidos.length > 0
            ? acompEscolhidos.join(', ')
            : 'Arroz, Feijão e Farofa',
        quantidade: 1,
        valorUnitario: precoMarmitaMontada,
        observacao: obsMarmita.trim() || undefined,
      },
    ]);
    setObsMarmita('');
  };

  const handleConfirmarPedidoDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sacola.length === 0) return;
    setEnviando(true);
    try {
      const proximoNumero =
        pedidos.length > 0
          ? Math.max(...pedidos.map((p) => p.numero || 100)) + 1
          : 101;

      const trocoVal =
        formaPag === 'dinheiro'
          ? parseFloat(precisaTrocoPara.replace(',', '.')) || 0
          : 0;

      const idCriado = await criarPedidoCompleto({
        numero: proximoNumero,
        origem: 'delivery',
        clienteNome: nomeCliente.trim(),
        clienteTelefone: telefoneCliente.trim(),
        enderecoEntrega: enderecoCliente.trim(),
        regiaoId: regiaoObj?.id,
        regiaoNome: regiaoObj?.nome,
        taxaEntrega,
        formaPagamento: formaPag,
        trocoPara: trocoVal > 0 ? trocoVal : undefined,
        observacoes: observacaoGeral.trim() || undefined,
        itens: sacola,
        enviarParaCozinha: true,
        registrarCliente: true,
      });

      setPedidoConfirmadoId(idCriado);
      setSacola([]);
      setObservacaoGeral('');
      setPrecisaTrocoPara('');
    } finally {
      setEnviando(false);
    }
  };

  const pedidoAcompanhado = pedidos.find((p) => p.id === pedidoConfirmadoId);

  return (
    <div className="space-y-6">
      {/* Cabeçalho estilo App Delivery */}
      <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-amber-400 font-medium">
            Cardápio Digital & Autoatendimento Delivery (Modelo iFood)
          </div>
          <h1 className="text-2xl font-bold font-display">
            {config.nomeRestaurante}
          </h1>
          <p className="text-xs text-slate-300">
            {config.enderecoRestaurante} · Tel: {config.telefoneRestaurante}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setAbaCardapio('destaques')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              abaCardapio === 'destaques'
                ? 'bg-amber-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Pratos & Marmitas Prontas
          </button>
          <button
            type="button"
            onClick={() => setAbaCardapio('montar_marmita')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              abaCardapio === 'montar_marmita'
                ? 'bg-amber-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Montar Minha Marmita
          </button>
          <button
            type="button"
            onClick={() => setAbaCardapio('bebidas')}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              abaCardapio === 'bebidas'
                ? 'bg-amber-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Bebidas ({bebidasDisponiveis.length})
          </button>
        </div>
      </div>

      {/* Acompanhamento em tempo real do pedido recém-feito */}
      {pedidoAcompanhado && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                Pedido #{pedidoAcompanhado.numero} recebido em tempo real!
              </span>
            </div>
            <p className="text-xs text-emerald-800">
              Status atual: <strong>{formatStatusPedido(pedidoAcompanhado.status)}</strong> · Horário:{' '}
              {formatTimeOnly(pedidoAcompanhado.criadoEm)}
              {pedidoAcompanhado.entregadorNome
                ? ` · Entregador: ${pedidoAcompanhado.entregadorNome}`
                : ''}
            </p>
          </div>
          <button
            onClick={() => setPedidoConfirmadoId(null)}
            className="text-xs font-semibold text-emerald-900 underline"
          >
            Fazer novo pedido
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Vitrine / Montador (7 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {abaCardapio === 'destaques' && (
            <div className="grid sm:grid-cols-2 gap-4">
              {pratosEPorcoes.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
                      {prod.imagemUrl ? (
                        <img
                          src={prod.imagemUrl}
                          alt={prod.nome}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Utensils className="w-7 h-7 text-slate-400" />
                      )}
                    </div>
                    <div className="p-4 space-y-1.5">
                      <div className="text-xs text-slate-500">{prod.categoria}</div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {prod.nome}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {prod.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                      {formatCurrency(prod.preco)}
                    </span>
                    <button
                      type="button"
                      onClick={() => adicionarProdutoPronto(prod)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {abaCardapio === 'montar_marmita' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <h2 className="text-base font-bold text-slate-900 font-display">
                Monte sua Marmita do Seu Jeito
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {(['Pequena', 'Média', 'Grande'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTamMarmita(t)}
                    className={`p-3 rounded-xl border text-left ${
                      tamMarmita === t
                        ? 'border-amber-600 bg-amber-50/70'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900">{t}</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-amber-700">
                      {formatCurrency(
                        t === 'Pequena'
                          ? config.precoMarmitaP
                          : t === 'Média'
                          ? config.precoMarmitaM
                          : config.precoMarmitaG
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Escolha a 1ª Carne
                  </label>
                  <select
                    value={carneEscolhida}
                    onChange={(e) => setCarneEscolhida(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Selecione...</option>
                    {carnesDisponiveis.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.preco > 0 ? `(+${formatCurrency(c.preco)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Escolha a 2ª Carne (Opcional)
                  </label>
                  <select
                    value={carne2Escolhida}
                    onChange={(e) => setCarne2Escolhida(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Sem 2ª carne</option>
                    {carnesDisponiveis.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.preco > 0 ? `(+${formatCurrency(c.preco)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Acompanhamentos Inclusos
                </label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {acompanhamentosDisponiveis.map((ac) => {
                    const checked = acompEscolhidos.includes(ac.nome);
                    return (
                      <label
                        key={ac.id}
                        className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setAcompEscolhidos((prev) =>
                              prev.includes(ac.nome)
                                ? prev.filter((x) => x !== ac.nome)
                                : [...prev, ac.nome]
                            )
                          }
                        />
                        <span>{ac.nome}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observação na Marmita
                </label>
                <input
                  type="text"
                  value={obsMarmita}
                  onChange={(e) => setObsMarmita(e.target.value)}
                  placeholder="Ex: Pouco arroz, sem cebola..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="button"
                onClick={adicionarMarmitaMontadaNaSacola}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Adicionar Marmita ({formatCurrency(precoMarmitaMontada)}) na Sacola
              </button>
            </div>
          )}

          {abaCardapio === 'bebidas' && (
            <div className="grid sm:grid-cols-2 gap-4">
              {bebidasDisponiveis.map((beb) => (
                <div
                  key={beb.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {beb.nome}
                    </div>
                    <div className="text-xs text-slate-500">{beb.descricao}</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-amber-700 mt-1">
                      {formatCurrency(beb.preco)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => adicionarProdutoPronto(beb)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shrink-0"
                  >
                    + Sacola
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna Direita: Sacola e Dados de Entrega (5 colunas) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              Sua Sacola de Delivery
            </h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {sacola.reduce((a, b) => a + b.quantidade, 0)} itens
            </span>
          </div>

          {sacola.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              Escolha produtos ou monte sua marmita ao lado para iniciar seu pedido.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {sacola.map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {item.quantidade}x {item.nome}
                    </div>
                    {item.carnes && (
                      <div className="text-slate-600">Carnes: {item.carnes}</div>
                    )}
                    {item.acompanhamentos && (
                      <div className="text-slate-600">
                        Acomp: {item.acompanhamentos}
                      </div>
                    )}
                    {item.observacao && (
                      <div className="text-amber-700">Obs: {item.observacao}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-semibold">
                      {formatCurrency(item.quantidade * item.valorUnitario)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSacola((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleConfirmarPedidoDelivery} className="space-y-3.5 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="Ex: Mariana Costa"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  WhatsApp / Telefone *
                </label>
                <input
                  type="text"
                  required
                  value={telefoneCliente}
                  onChange={(e) => setTelefoneCliente(e.target.value)}
                  placeholder="(11) 98888-7777"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Região de Entrega (Taxa Automática) *
              </label>
              <select
                value={regiaoObj?.id || ''}
                onChange={(e) => setRegiaoSelecionadaId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {regioesAtivas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome} — Taxa: {formatCurrency(r.taxa)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Endereço Completo de Entrega (Rua, Nº, Bairro, Complemento) *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={enderecoCliente}
                  onChange={(e) => setEnderecoCliente(e.target.value)}
                  placeholder="Rua das Flores, 240, Apto 12 - Centro"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Forma de Pagamento *
                </label>
                <select
                  value={formaPag}
                  onChange={(e) => setFormaPag(e.target.value as FormaPagamento)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                </select>
              </div>

              {formaPag === 'dinheiro' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Precisa de troco para quanto?
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={precisaTrocoPara}
                    onChange={(e) => setPrecisaTrocoPara(e.target.value)}
                    placeholder="Ex: 100.00"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observações do Pedido
              </label>
              <input
                type="text"
                value={observacaoGeral}
                onChange={(e) => setObservacaoGeral(e.target.value)}
                placeholder="Ex: Interfone 12, deixar na portaria..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal dos Produtos:</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(subtotalSacola)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxa de Entrega ({regiaoObj?.nome || 'Padrão'}):</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(sacola.length > 0 ? taxaEntrega : 0)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total a Pagar:</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(totalComEntrega)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={sacola.length === 0 || enviando}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {enviando ? 'Enviando Pedido...' : 'Confirmar Pedido de Delivery'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
