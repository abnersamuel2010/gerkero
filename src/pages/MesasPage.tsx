import React, { useState } from 'react';
import { Plus, Users, Utensils, CalendarClock } from 'lucide-react';
import {
  Mesa,
  Comanda,
  ConfiguracaoRestaurante,
} from '../types';
import {
  criarMesa,
  atualizarStatusMesa,
} from '../services/mesasService';
import { abrirComandaMesa } from '../services/comandasService';
import { formatCurrency } from '../utils/formatters';

interface MesasPageProps {
  mesas: Mesa[];
  comandas: Comanda[];
  config: ConfiguracaoRestaurante;
  onOpenComanda: (comandaId: string) => void;
}

export const MesasPage: React.FC<MesasPageProps> = ({
  mesas,
  comandas,
  config,
  onOpenComanda,
}) => {
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [pessoas, setPessoas] = useState(2);
  const [modalidadeBuffet, setModalidadeBuffet] = useState<
    'sem_buffet' | 'adulto' | 'crianca'
  >('sem_buffet');
  const [nomeReserva, setNomeReserva] = useState('');
  const [abrindo, setAbrindo] = useState(false);

  const [novoNumeroMesa, setNovoNumeroMesa] = useState('');
  const [novaCapacidade, setNovaCapacidade] = useState('4');

  const mesasOrdenadas = [...mesas].sort((a, b) => a.numero - b.numero);

  const handleClickMesa = (mesa: Mesa) => {
    const comandaAtiva = comandas.find(
      (c) =>
        (c.id === mesa.comandaId || c.mesaId === mesa.id) &&
        (c.status === 'aberta' || c.status === 'aguardando_pagamento')
    );

    if (comandaAtiva) {
      onOpenComanda(comandaAtiva.id);
      return;
    }

    setMesaSelecionada(mesa);
    setPessoas(mesa.pessoas > 0 ? mesa.pessoas : 2);
    setNomeReserva(mesa.clienteReserva || '');
    setModalidadeBuffet('sem_buffet');
  };

  const handleConfirmarAberturaComanda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mesaSelecionada) return;
    setAbrindo(true);
    try {
      let tipoBuffet = 'Consumo à la carte / Cardápio';
      let valorPorPessoa = 0;

      if (modalidadeBuffet === 'adulto') {
        tipoBuffet = 'Buffet Livre Adulto';
        valorPorPessoa = config.precoBuffetAdulto || 44.9;
      } else if (modalidadeBuffet === 'crianca') {
        tipoBuffet = 'Buffet Infantil / Criança';
        valorPorPessoa = config.precoBuffetCrianca || 24.9;
      }

      const comandaId = await abrirComandaMesa({
        mesa: mesaSelecionada,
        pessoas,
        tipoBuffet,
        valorPorPessoaBuffet: valorPorPessoa,
      });

      setMesaSelecionada(null);
      onOpenComanda(comandaId);
    } finally {
      setAbrindo(false);
    }
  };

  const handleReservarMesa = async () => {
    if (!mesaSelecionada) return;
    await atualizarStatusMesa(
      mesaSelecionada,
      'reservada',
      pessoas,
      '',
      nomeReserva || 'Cliente Reservado'
    );
    setMesaSelecionada(null);
  };

  const handleLiberarMesa = async () => {
    if (!mesaSelecionada) return;
    await atualizarStatusMesa(mesaSelecionada, 'livre', 0, '', '');
    setMesaSelecionada(null);
  };

  const handleCriarNovaMesa = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(novoNumeroMesa, 10);
    if (!num || num <= 0) return;
    await criarMesa(num, parseInt(novaCapacidade, 10) || 4);
    setNovoNumeroMesa('');
  };

  const obterEstiloMesa = (status: Mesa['status']) => {
    switch (status) {
      case 'livre':
        return {
          card: 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 text-emerald-950',
          label: 'Livre',
          indicador: 'text-emerald-700',
        };
      case 'ocupada':
        return {
          card: 'bg-red-50/70 border-red-300 hover:border-red-500 text-red-950',
          label: 'Ocupada',
          indicador: 'text-red-700',
        };
      case 'aguardando_pagamento':
        return {
          card: 'bg-amber-50/80 border-amber-400 hover:border-amber-600 text-amber-950',
          label: 'Aguardando Pagamento',
          indicador: 'text-amber-800',
        };
      case 'reservada':
        return {
          card: 'bg-blue-50/70 border-blue-300 hover:border-blue-500 text-blue-950',
          label: 'Reservada',
          indicador: 'text-blue-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Legenda de Cores */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Mapa Visual de Mesas do Salão
          </h1>
          <p className="text-sm text-slate-600">
            Clique em qualquer mesa para abrir ou acessar sua comanda digital e consumo de buffet
          </p>
        </div>

        <form onSubmit={handleCriarNovaMesa} className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={novoNumeroMesa}
            onChange={(e) => setNovoNumeroMesa(e.target.value)}
            placeholder="Nº nova mesa"
            className="w-32 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono tabular-nums"
          />
          <select
            value={novaCapacidade}
            onChange={(e) => setNovaCapacidade(e.target.value)}
            className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="2">2 lugares</option>
            <option value="4">4 lugares</option>
            <option value="6">6 lugares</option>
            <option value="8">8 lugares</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Mesa
          </button>
        </form>
      </div>

      {/* Resumo de Status */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
          Livre ({mesas.filter((m) => m.status === 'livre').length})
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
          Ocupada ({mesas.filter((m) => m.status === 'ocupada').length})
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
          Aguardando Pagamento (
          {mesas.filter((m) => m.status === 'aguardando_pagamento').length})
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
          Reservada ({mesas.filter((m) => m.status === 'reservada').length})
        </span>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {mesasOrdenadas.map((mesa) => {
          const estilo = obterEstiloMesa(mesa.status);
          const comandaVinculada = comandas.find(
            (c) =>
              (c.id === mesa.comandaId || c.mesaId === mesa.id) &&
              (c.status === 'aberta' || c.status === 'aguardando_pagamento')
          );

          return (
            <button
              key={mesa.id}
              type="button"
              onClick={() => handleClickMesa(mesa)}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between min-h-[148px] ${estilo.card}`}
            >
              <div className="flex items-start justify-between w-full">
                <div>
                  <div className="text-lg font-bold font-display">
                    Mesa {String(mesa.numero).padStart(2, '0')}
                  </div>
                  <div className={`text-xs font-semibold ${estilo.indicador}`}>
                    {estilo.label}
                  </div>
                </div>
                <span className="text-xs font-mono tabular-nums opacity-75 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {mesa.pessoas > 0 ? `${mesa.pessoas}/${mesa.capacidade}` : `${mesa.capacidade} lug.`}
                </span>
              </div>

              <div className="pt-3 border-t border-black/10 w-full space-y-1 text-xs">
                {comandaVinculada ? (
                  <>
                    <div className="font-mono tabular-nums text-[11px] opacity-80">
                      {comandaVinculada.codigo}
                    </div>
                    <div className="font-mono tabular-nums font-bold text-sm">
                      {formatCurrency(comandaVinculada.total)}
                    </div>
                  </>
                ) : mesa.status === 'reservada' ? (
                  <div className="truncate font-medium">
                    Reserva: {mesa.clienteReserva || 'Confirmada'}
                  </div>
                ) : (
                  <div className="opacity-70">Clique para abrir comanda</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal de Abertura de Comanda ou Reserva da Mesa */}
      {mesaSelecionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Mesa {String(mesaSelecionada.numero).padStart(2, '0')} — Abrir Comanda ou Reservar
              </h2>
              <button
                onClick={() => setMesaSelecionada(null)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleConfirmarAberturaComanda} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantidade de Pessoas na Mesa
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={pessoas}
                  onChange={(e) => setPessoas(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Modalidade Inicial (Buffet ou Cardápio)
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg text-xs cursor-pointer">
                    <span className="flex items-center gap-2 font-medium">
                      <input
                        type="radio"
                        name="buffet"
                        checked={modalidadeBuffet === 'sem_buffet'}
                        onChange={() => setModalidadeBuffet('sem_buffet')}
                      />
                      À La Carte / Porções / Bebidas (Sem Buffet Fixo)
                    </span>
                    <span className="font-mono tabular-nums">R$ 0,00/pessoa</span>
                  </label>

                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg text-xs cursor-pointer">
                    <span className="flex items-center gap-2 font-medium">
                      <input
                        type="radio"
                        name="buffet"
                        checked={modalidadeBuffet === 'adulto'}
                        onChange={() => setModalidadeBuffet('adulto')}
                      />
                      Buffet Livre Adulto ({pessoas}x)
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-amber-700">
                      {formatCurrency(config.precoBuffetAdulto)}/pessoa
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg text-xs cursor-pointer">
                    <span className="flex items-center gap-2 font-medium">
                      <input
                        type="radio"
                        name="buffet"
                        checked={modalidadeBuffet === 'crianca'}
                        onChange={() => setModalidadeBuffet('crianca')}
                      />
                      Buffet Infantil / Criança ({pessoas}x)
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-amber-700">
                      {formatCurrency(config.precoBuffetCrianca)}/pessoa
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={abrindo}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Utensils className="w-4 h-4" />
                {abrindo ? 'Abrindo Comanda...' : 'Abrir Comanda Digital da Mesa'}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="text-xs font-semibold text-slate-700">
                Ou gerenciar Reserva da Mesa:
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nomeReserva}
                  onChange={(e) => setNomeReserva(e.target.value)}
                  placeholder="Nome do cliente para reserva..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleReservarMesa}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  Reservar
                </button>
              </div>
              {mesaSelecionada.status === 'reservada' && (
                <button
                  type="button"
                  onClick={handleLiberarMesa}
                  className="w-full py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg"
                >
                  Liberar Mesa para Livre
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
