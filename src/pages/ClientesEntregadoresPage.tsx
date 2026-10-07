import React, { useState } from 'react';
import { Truck, UserPlus, CheckCircle2, Phone, MapPin } from 'lucide-react';
import {
  Entregador,
  EntregadorStatus,
  Entrega,
  Cliente,
  Pedido,
  Caixa,
} from '../types';
import {
  criarEntregador,
  atualizarStatusEntregador,
  concluirEntrega,
} from '../services/deliveryService';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  formatCurrency,
  formatDateTime,
  generateSafeId,
} from '../utils/formatters';

interface ClientesEntregadoresPageProps {
  entregadores: Entregador[];
  entregas: Entrega[];
  clientes: Cliente[];
  pedidos: Pedido[];
  caixaAberto: Caixa | null;
}

export const ClientesEntregadoresPage: React.FC<
  ClientesEntregadoresPageProps
> = ({ entregadores, entregas, clientes, pedidos, caixaAberto }) => {
  const [aba, setAba] = useState<'entregadores' | 'minhas_entregas' | 'clientes'>(
    'entregadores'
  );

  // Form Entregador
  const [nomeEnt, setNomeEnt] = useState('');
  const [telEnt, setTelEnt] = useState('');
  const [veiculoEnt, setVeiculoEnt] = useState('');

  // Form Cliente
  const [nomeCli, setNomeCli] = useState('');
  const [telCli, setTelCli] = useState('');
  const [endCli, setEndCli] = useState('');

  const handleNovoEntregador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEnt.trim()) return;
    await criarEntregador({
      nome: nomeEnt,
      telefone: telEnt,
      veiculo: veiculoEnt,
      status: 'disponivel',
    });
    setNomeEnt('');
    setTelEnt('');
    setVeiculoEnt('');
  };

  const handleNovoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCli.trim()) return;
    const id = generateSafeId('cli');
    try {
      await setDoc(doc(db, 'clientes', id), {
        nome: nomeCli.trim().slice(0, 120),
        telefone: telCli.trim().slice(0, 30),
        endereco: endCli.trim().slice(0, 250),
        totalPedidos: 0,
        criadoEm: new Date().toISOString(),
      });
      setNomeCli('');
      setTelCli('');
      setEndCli('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `clientes/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Entregadores, Rotas & Clientes
          </h1>
          <p className="text-sm text-slate-600">
            Gerencie o status dos entregadores, acompanhe entregas atribuídas e cadastre clientes
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            onClick={() => setAba('entregadores')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'entregadores'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Entregadores ({entregadores.length})
          </button>
          <button
            onClick={() => setAba('minhas_entregas')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'minhas_entregas'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Painel do Entregador ({entregas.filter((e) => e.status !== 'entregue').length})
          </button>
          <button
            onClick={() => setAba('clientes')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'clientes'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clientes ({clientes.length})
          </button>
        </div>
      </div>

      {aba === 'entregadores' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" />
              Cadastrar Entregador
            </h2>
            <form onSubmit={handleNovoEntregador} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nomeEnt}
                  onChange={(e) => setNomeEnt(e.target.value)}
                  placeholder="Ex: Lucas Ferreira"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={telEnt}
                  onChange={(e) => setTelEnt(e.target.value)}
                  placeholder="(11) 99999-0000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Moto / Veículo / Placa
                </label>
                <input
                  type="text"
                  value={veiculoEnt}
                  onChange={(e) => setVeiculoEnt(e.target.value)}
                  placeholder="Honda CG 160 - ABC-1234"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Salvar Entregador
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
            {entregadores.map((ent) => (
              <div
                key={ent.id}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      {ent.nome}
                    </h3>
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {ent.entregasRealizadas || 0} entregas
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {ent.telefone}
                  </div>
                  {ent.veiculo && (
                    <div className="text-xs text-slate-500">{ent.veiculo}</div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">Status:</span>
                  <select
                    value={ent.status}
                    onChange={(e) =>
                      atualizarStatusEntregador(
                        ent.id,
                        e.target.value as EntregadorStatus
                      )
                    }
                    className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_entrega">Em Entrega</option>
                    <option value="indisponivel">Indisponível</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {aba === 'minhas_entregas' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Entregas Atribuídas aos Entregadores
          </h2>
          {entregas.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              Nenhuma entrega atribuída no momento. Atribua pedidos no Painel Delivery Kanban.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entregas.map((deliv) => {
                const pedObj = pedidos.find((p) => p.id === deliv.pedidoId);
                const entObj = entregadores.find(
                  (e) => e.id === deliv.entregadorId
                );

                return (
                  <div
                    key={deliv.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-mono tabular-nums font-bold text-sm text-slate-900">
                          Pedido #{deliv.numeroPedido}
                        </span>
                        <span className="font-semibold text-amber-700">
                          Motoboy: {deliv.entregadorNome}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-900">
                        Cliente: {deliv.clienteNome}
                      </div>
                      {deliv.clienteTelefone && (
                        <div className="text-slate-600">
                          Tel: {deliv.clienteTelefone}
                        </div>
                      )}
                      <div className="text-slate-700 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{deliv.endereco}</span>
                      </div>

                      <div className="pt-1 flex justify-between font-mono tabular-nums">
                        <span>Taxa: {formatCurrency(deliv.taxaEntrega || 0)}</span>
                        <span className="font-bold text-slate-900">
                          Total: {formatCurrency(deliv.valorTotalPedido || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      {deliv.status !== 'entregue' ? (
                        <button
                          onClick={() =>
                            concluirEntrega(deliv, pedObj, entObj, caixaAberto)
                          }
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmar Entrega Realizada
                        </button>
                      ) : (
                        <div className="text-center font-semibold text-emerald-700 py-1">
                          Entregue em {formatDateTime(deliv.entregueEm)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {aba === 'clientes' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-600" />
              Cadastrar Cliente
            </h2>
            <form onSubmit={handleNovoCliente} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nomeCli}
                  onChange={(e) => setNomeCli(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="text"
                  required
                  value={telCli}
                  onChange={(e) => setTelCli(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  required
                  value={endCli}
                  onChange={(e) => setEndCli(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Salvar Cliente
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4">Endereço</th>
                  <th className="py-3 px-4">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {c.nome}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {c.telefone}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {c.endereco}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-500">
                      {formatDateTime(c.criadoEm)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
