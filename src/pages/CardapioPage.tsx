import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Upload, Utensils, Check, Ban, RefreshCw, Calendar, Package, Minus } from 'lucide-react';
import { Produto, CategoriaNome } from '../types';
import {
  criarProduto,
  atualizarProduto,
  alternarDisponibilidadeProduto,
  excluirProduto,
  uploadImagemProduto,
  ajustarEstoqueProduto,
} from '../services/produtosService';
import {
  limparItensDemonstracao,
  converterDemonstracaoParaReal,
  sincronizarCardapioCompletoOficial,
} from '../services/firestoreService';
import { DIAS_DA_SEMANA } from '../data/cardapioOficial';
import { formatCurrency, cleanDemoTag } from '../utils/formatters';

interface CardapioPageProps {
  produtos: Produto[];
  ehAdmin: boolean;
}

const CATEGORIAS_LISTA: CategoriaNome[] = [
  'Marmitas',
  'Carnes',
  'Carnes Especiais',
  'Acompanhamentos',
  'Bebidas',
  'Porções',
  'Doces e Sobremesas',
  'Saladas Avulsas',
  'Buffet',
  'Adicionais',
  'Outros',
];

export const CardapioPage: React.FC<CardapioPageProps> = ({
  produtos,
  ehAdmin,
}) => {
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaNome>('Marmitas');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('25.00');
  const [imagemUrl, setImagemUrl] = useState('');
  const [disponivel, setDisponivel] = useState(true);
  const [ativo, setAtivo] = useState(true);
  const [estoque, setEstoque] = useState('');
  const [diasSemana, setDiasSemana] = useState<string[]>([
    'segunda',
    'terca',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
  ]);
  const [ehEspecial, setEhEspecial] = useState(false);
  const [exigeSegundaCarne, setExigeSegundaCarne] = useState(false);
  const [tamanhosPermitidos, setTamanhosPermitidos] = useState<
    ('Pequena' | 'Média' | 'Grande')[]
  >(['Pequena', 'Média', 'Grande']);
  const [canalVenda, setCanalVenda] = useState<'ambos' | 'balcao' | 'delivery'>('ambos');
  const [salvando, setSalvando] = useState(false);
  const [fazendoUpload, setFazendoUpload] = useState(false);

  const abrirModalNovo = () => {
    setEditandoId(null);
    setNome('');
    setCategoria('Carnes');
    setDescricao('');
    setPreco('0.00');
    setImagemUrl('');
    setEstoque('');
    setDiasSemana(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']);
    setEhEspecial(false);
    setExigeSegundaCarne(false);
    setTamanhosPermitidos(['Pequena', 'Média', 'Grande']);
    setCanalVenda('ambos');
    setDisponivel(true);
    setAtivo(true);
    setModalAberto(true);
  };

  const abrirModalEditar = (prod: Produto) => {
    setEditandoId(prod.id);
    setNome(cleanDemoTag(prod.nome));
    setCategoria(prod.categoria);
    setDescricao(prod.descricao);
    setPreco(String(prod.preco));
    setImagemUrl(prod.imagemUrl || '');
    setEstoque(prod.estoque !== undefined ? String(prod.estoque) : '');
    setDiasSemana(
      prod.diasSemana && prod.diasSemana.length > 0
        ? prod.diasSemana
        : ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
    );
    setEhEspecial(Boolean(prod.ehEspecial));
    setExigeSegundaCarne(Boolean(prod.exigeSegundaCarne));
    setTamanhosPermitidos(
      prod.tamanhosPermitidos && prod.tamanhosPermitidos.length > 0
        ? prod.tamanhosPermitidos
        : prod.ehEspecial
        ? ['Média', 'Grande']
        : ['Pequena', 'Média', 'Grande']
    );
    setCanalVenda(prod.canalVenda || 'ambos');
    setDisponivel(prod.disponivel);
    setAtivo(prod.ativo);
    setModalAberto(true);
  };

  const handleUploadArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFazendoUpload(true);
    try {
      const url = await uploadImagemProduto(file);
      setImagemUrl(url);
    } catch (err) {
      console.error('Erro ao enviar imagem para Firebase Storage:', err);
    } finally {
      setFazendoUpload(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const precoNum = Math.max(0, parseFloat(preco.replace(',', '.')) || 0);
      const estoqueNum =
        estoque.trim() !== '' ? Math.max(0, parseInt(estoque, 10) || 0) : undefined;
      const nomeLimpo = cleanDemoTag(nome);

      if (editandoId) {
        await atualizarProduto(editandoId, {
          nome: nomeLimpo,
          categoria,
          descricao,
          preco: precoNum,
          imagemUrl,
          disponivel,
          ativo,
          estoque: estoqueNum,
          diasSemana,
          ehEspecial,
          exigeSegundaCarne,
          tamanhosPermitidos,
          canalVenda,
          ehDadoDemonstracao: false,
        });
      } else {
        await criarProduto({
          nome: nomeLimpo,
          categoria,
          descricao,
          preco: precoNum,
          imagemUrl,
          disponivel,
          ativo,
          estoque: estoqueNum,
          diasSemana,
          ehEspecial,
          exigeSegundaCarne,
          tamanhosPermitidos,
          canalVenda,
          ehDadoDemonstracao: false,
        });
      }
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  };

  const produtosFiltrados = produtos.filter((p) => {
    const matchCat = filtroCategoria === 'Todas' || p.categoria === filtroCategoria;
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  const temDadosDemo = produtos.some((p) => p.ehDadoDemonstracao);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Cardápio & Gestão de Produtos
          </h1>
          <p className="text-sm text-slate-600">
            Altere preços em tempo real e marque carnes ou acompanhamentos como indisponíveis quando acabarem no dia
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {ehAdmin && (
            <button
              onClick={async () => {
                setSincronizando(true);
                try {
                  await sincronizarCardapioCompletoOficial();
                } finally {
                  setSincronizando(false);
                }
              }}
              disabled={sincronizando}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
              title="Carrega ou atualiza os 30+ itens oficiais do cardápio semanal"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar Cardápio Oficial'}
            </button>
          )}

          {ehAdmin && temDadosDemo && (
            <>
              <button
                onClick={() => converterDemonstracaoParaReal()}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
              >
                Limpar Etiquetas [Demo] (Tornar Oficial)
              </button>
              <button
                onClick={() => limparItensDemonstracao()}
                className="px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
              >
                Remover Itens [Demo]
              </button>
            </>
          )}
          <button
            onClick={abrirModalNovo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Filtros de Categoria e Busca */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {['Todas', ...CATEGORIAS_LISTA].map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filtroCategoria === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto ou ingrediente..."
          className="px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600 w-full lg:w-72"
        />
      </div>

      {/* Lista de Produtos */}
      {produtosFiltrados.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">
            Nenhum produto encontrado nesta categoria.
          </p>
          <button
            onClick={abrirModalNovo}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Cadastrar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produtosFiltrados.map((prod) => (
            <div
              key={prod.id}
              className={`bg-white border rounded-xl overflow-hidden flex flex-col justify-between transition-opacity ${
                !prod.disponivel || !prod.ativo
                  ? 'border-slate-200 opacity-75'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Imagem com Fallback Seguro (Zero-Broken-Image Policy) */}
                <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {prod.imagemUrl ? (
                    <img
                      src={prod.imagemUrl}
                      alt={prod.nome}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Utensils className="w-7 h-7" />
                      <span className="text-[11px]">{prod.categoria}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{prod.categoria}</span>
                    <span>·</span>
                    <span
                      className={
                        prod.disponivel
                          ? 'text-emerald-700 font-medium'
                          : 'text-red-600 font-medium'
                      }
                    >
                      {prod.disponivel ? 'Disponível hoje' : 'Esgotado no dia'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                    {cleanDemoTag(prod.nome)}
                  </h3>

                  {/* Badges de Estoque, Dias da Semana, Canal e Tamanhos */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {prod.estoque !== undefined && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono font-medium">
                        <Package className="w-3 h-3 text-slate-500" />
                        Estoque: {prod.estoque} un
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        prod.canalVenda === 'balcao'
                          ? 'bg-orange-50 text-orange-800 border-orange-200'
                          : prod.canalVenda === 'delivery'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {prod.canalVenda === 'balcao'
                        ? '🏪 Só Balcão'
                        : prod.canalVenda === 'delivery'
                        ? '🛵 Só Delivery'
                        : '🏪🛵 Ambos'}
                    </span>

                    {(prod.categoria === 'Carnes' ||
                      prod.categoria === 'Carnes Especiais' ||
                      prod.tamanhosPermitidos) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                        🍱 Tam:{' '}
                        {prod.tamanhosPermitidos
                          ? prod.tamanhosPermitidos.map((t) => t[0]).join(', ')
                          : prod.ehEspecial
                          ? 'M, G'
                          : 'P, M, G'}
                      </span>
                    )}

                    {prod.ehEspecial && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                        Especial {prod.preco > 0 ? `(+${formatCurrency(prod.preco)})` : ''}
                      </span>
                    )}
                    {prod.exigeSegundaCarne && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-semibold">
                        Exige 2ª carne
                      </span>
                    )}
                    {prod.diasSemana && prod.diasSemana.length > 0 && prod.diasSemana.length < 6 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        {prod.diasSemana.map((d) => d.slice(0, 3)).join(', ')}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {prod.descricao}
                  </p>

                  <div className="pt-1 text-base font-bold text-slate-900 font-mono tabular-nums">
                    {prod.preco === 0 ? 'Incluso na Marmita' : formatCurrency(prod.preco)}
                  </div>
                </div>
              </div>

              {/* Quick stock adjustment for admin */}
              {prod.estoque !== undefined && ehAdmin && (
                <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estoque:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => ajustarEstoqueProduto(prod.id, prod.estoque, -1)}
                      className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold"
                      title="Diminuir 1 unidade"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-slate-900 px-1.5">
                      {prod.estoque} un
                    </span>
                    <button
                      type="button"
                      onClick={() => ajustarEstoqueProduto(prod.id, prod.estoque, 1)}
                      className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold"
                      title="Aumentar 1 unidade"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={() => alternarDisponibilidadeProduto(prod)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    prod.disponivel
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  {prod.disponivel ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Ativo no Dia
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      Indisponível
                    </>
                  )}
                </button>

                <button
                  onClick={() => abrirModalEditar(prod)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
                  title="Editar Produto e Preço"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {ehAdmin && (
                  <button
                    onClick={() => excluirProduto(prod.id, prod.nome)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir Produto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Produto */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 font-display">
              {editandoId ? 'Editar Produto / Preço' : 'Novo Produto do Cardápio'}
            </h2>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Picanha na Brasa"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaNome)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-amber-600"
                  >
                    {CATEGORIAS_LISTA.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Preço (R$) — Use 0 para item incluso
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Descrição / Ingredientes
                </label>
                <textarea
                  rows={2}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o preparo ou acompanhamentos..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Imagem (URL ou Upload para Firebase Storage)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imagemUrl}
                    onChange={(e) => setImagemUrl(e.target.value)}
                    placeholder="https://... ou faça upload ao lado"
                    className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg cursor-pointer whitespace-nowrap">
                    <Upload className="w-4 h-4" />
                    {fazendoUpload ? 'Enviando...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadArquivo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Controle de Estoque */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Controle de Estoque (Unidades) — Deixe vazio para sem limite
                </label>
                <input
                  type="number"
                  min="0"
                  value={estoque}
                  onChange={(e) => setEstoque(e.target.value)}
                  placeholder="Ex: 48, 30, 24... (deixe em branco para ilimitado)"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Seleção dos Dias da Semana da Carne/Prato */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Dias da Semana em que este Item é Servido:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DIAS_DA_SEMANA.map((dia) => {
                    const marcado = diasSemana.includes(dia.key);
                    return (
                      <button
                        key={dia.key}
                        type="button"
                        onClick={() => {
                          setDiasSemana((prev) =>
                            prev.includes(dia.key)
                              ? prev.filter((d) => d !== dia.key)
                              : [...prev, dia.key]
                          );
                        }}
                        className={`py-1.5 px-1 text-center rounded-lg text-xs font-semibold border transition-colors ${
                          marcado
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {dia.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500">
                  * No site do cliente, as carnes aparecem apenas no dia selecionado correspondente.
                </p>
              </div>

              {/* Seleção dos Tamanhos de Marmita Permitidos para esta Carne */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    🍱 Tamanhos de Marmita em que esta Carne pode ir:
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setTamanhosPermitidos(['Pequena', 'Média', 'Grande'])}
                      className="text-amber-700 hover:underline font-semibold"
                    >
                      Todos (P, M, G)
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setTamanhosPermitidos(['Média', 'Grande'])}
                      className="text-purple-700 hover:underline font-semibold"
                    >
                      Apenas M e G
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['Pequena', 'Média', 'Grande'] as const).map((tam) => {
                    const marcado = tamanhosPermitidos.includes(tam);
                    return (
                      <button
                        key={tam}
                        type="button"
                        onClick={() => {
                          setTamanhosPermitidos((prev) =>
                            prev.includes(tam)
                              ? prev.length > 1
                                ? prev.filter((t) => t !== tam)
                                : prev
                              : [...prev, tam]
                          );
                        }}
                        className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          marcado
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{marcado ? '✓' : ''}</span>
                        <span>Marmita {tam}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500">
                  * Configure se a carne vai em todas ou apenas nas marmitas Média e Grande (como carnes nobres/especiais).
                </p>
              </div>

              {/* Opções de Carnes Especiais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ehEspecial}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setEhEspecial(val);
                      if (val) {
                        // Carnes especiais vão apenas na Média e Grande
                        setTamanhosPermitidos(['Média', 'Grande']);
                      }
                    }}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  Carne Especial (Restringe para Média e Grande)
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exigeSegundaCarne}
                    onChange={(e) => setExigeSegundaCarne(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  Permite 2ª Carne Mista
                </label>
              </div>

              {/* Seleção do Canal de Venda (Balcão / Delivery / Ambos) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  🛵 Canal de Venda (Onde este produto será vendido):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ambos', label: 'Ambos (Balcão & Delivery)', icone: '🏪🛵' },
                    { id: 'balcao', label: 'Apenas Balcão / Salão', icone: '🏪' },
                    { id: 'delivery', label: 'Apenas Delivery Online', icone: '🛵' },
                  ].map((canal) => {
                    const selecionado = canalVenda === canal.id;
                    return (
                      <button
                        key={canal.id}
                        type="button"
                        onClick={() => setCanalVenda(canal.id as 'ambos' | 'balcao' | 'delivery')}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 ${
                          selecionado
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{canal.icone}</span>
                        <span className="text-[11px] text-center leading-tight">{canal.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500">
                  * Produtos marcados como "Apenas Balcão" não serão exibidos no site de delivery do cliente.
                </p>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disponivel}
                    onChange={(e) => setDisponivel(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  Disponível hoje para pedidos
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  Cadastro Ativo
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
