import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  Lock,
  Unlock,
  Trash2,
  Save,
  History,
  MapPin,
  Plus,
  Check,
} from 'lucide-react';
import {
  Usuario,
  UserRole,
  ConfiguracaoRestaurante,
  LogAuditoria,
  RegiaoEntrega,
} from '../types';
import {
  criarUsuarioPainelAdmin,
  atualizarUsuarioPainelAdmin,
  excluirUsuarioPainelAdmin,
  salvarConfiguracaoRestaurante,
} from '../services/usuariosService';
import {
  criarRegiaoEntrega,
  atualizarRegiaoEntrega,
  excluirRegiaoEntrega,
} from '../services/deliveryService';
import {
  formatDateTime,
  formatRoleName,
  formatCurrency,
} from '../utils/formatters';

interface UsuariosConfigPageProps {
  usuarios: Usuario[];
  config: ConfiguracaoRestaurante;
  logsAuditoria: LogAuditoria[];
  regioes?: RegiaoEntrega[];
}

export const UsuariosConfigPage: React.FC<UsuariosConfigPageProps> = ({
  usuarios,
  config,
  logsAuditoria,
  regioes = [],
}) => {
  const [aba, setAba] = useState<
    'usuarios' | 'configuracoes' | 'taxas_ruas' | 'auditoria'
  >('usuarios');

  // Gerenciamento de Taxas por Rua / Bairro
  const [nomeRua, setNomeRua] = useState('');
  const [taxaRua, setTaxaRua] = useState('8.00');
  const [tempoEstimado, setTempoEstimado] = useState('35');
  const [salvandoRua, setSalvandoRua] = useState(false);
  const [buscaRua, setBuscaRua] = useState('');

  // Novo Usuário
  const [nomeUsr, setNomeUsr] = useState('');
  const [emailUsr, setEmailUsr] = useState('');
  const [funcaoUsr, setFuncaoUsr] = useState<UserRole>('atendente');
  const [permissoesUsr, setPermissoesUsr] = useState('');

  // Configurações do Restaurante e Preços
  const [nomeRest, setNomeRest] = useState(config.nomeRestaurante);
  const [telRest, setTelRest] = useState(config.telefoneRestaurante || '');
  const [endRest, setEndRest] = useState(config.enderecoRestaurante || '');
  const [cnpjRest, setCnpjRest] = useState(config.cnpj || '');
  const [precoP, setPrecoP] = useState(String(config.precoMarmitaP || 20));
  const [precoM, setPrecoM] = useState(String(config.precoMarmitaM || 25));
  const [precoG, setPrecoG] = useState(String(config.precoMarmitaG || 30));
  const [buffetAdulto, setBuffetAdulto] = useState(
    String(config.precoBuffetAdulto || 44.9)
  );
  const [buffetCrianca, setBuffetCrianca] = useState(
    String(config.precoBuffetCrianca || 24.9)
  );
  const [buffetKilo, setBuffetKilo] = useState(
    String(config.precoBuffetKilo || 69.9)
  );
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeUsr.trim() || !emailUsr.trim()) return;
    await criarUsuarioPainelAdmin({
      nome: nomeUsr,
      email: emailUsr,
      funcao: funcaoUsr,
      permissoes: permissoesUsr.trim() || undefined,
    });
    setNomeUsr('');
    setEmailUsr('');
    setPermissoesUsr('');
  };

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoConfig(true);
    setMensagemSucesso('');
    try {
      await salvarConfiguracaoRestaurante({
        nomeRestaurante: nomeRest,
        telefoneRestaurante: telRest,
        enderecoRestaurante: endRest,
        cnpj: cnpjRest,
        precoMarmitaP: parseFloat(precoP.replace(',', '.')) || 20,
        precoMarmitaM: parseFloat(precoM.replace(',', '.')) || 25,
        precoMarmitaG: parseFloat(precoG.replace(',', '.')) || 30,
        precoBuffetAdulto: parseFloat(buffetAdulto.replace(',', '.')) || 44.9,
        precoBuffetCrianca: parseFloat(buffetCrianca.replace(',', '.')) || 24.9,
        precoBuffetKilo: parseFloat(buffetKilo.replace(',', '.')) || 69.9,
      });
      setMensagemSucesso(
        'Preços e configurações do restaurante salvos no Cloud Firestore com sucesso!'
      );
    } finally {
      setSalvandoConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Usuários, Permissões & Configurações
          </h1>
          <p className="text-sm text-slate-600">
            Controle administrativo de funcionários, preços globais de Marmitas/Buffet e Logs de Auditoria
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            onClick={() => setAba('usuarios')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'usuarios'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Usuários & Permissões ({usuarios.length})
          </button>
          <button
            onClick={() => setAba('configuracoes')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'configuracoes'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Preços & Dados do Restaurante
          </button>
          <button
            onClick={() => setAba('taxas_ruas')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'taxas_ruas'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Taxas por Rua / Bairro ({regioes.length})
          </button>
          <button
            onClick={() => setAba('auditoria')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'auditoria'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auditoria ({logsAuditoria.length})
          </button>
        </div>
      </div>

      {aba === 'usuarios' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Cadastrar Usuário */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-600" />
              Criar Usuário / Funcionário
            </h2>
            <form onSubmit={handleCriarUsuario} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nomeUsr}
                  onChange={(e) => setNomeUsr(e.target.value)}
                  placeholder="Ex: Ana Paula (Caixa)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  required
                  value={emailUsr}
                  onChange={(e) => setEmailUsr(e.target.value)}
                  placeholder="ana@restaurante.com.br"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Função / Perfil de Acesso *
                </label>
                <select
                  value={funcaoUsr}
                  onChange={(e) => setFuncaoUsr(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="administrador">
                    Administrador (Acesso completo)
                  </option>
                  <option value="caixa">
                    Caixa (Caixa, vendas e fechamento)
                  </option>
                  <option value="atendente">
                    Atendente/Garçom (Mesas, comandas e pedidos)
                  </option>
                  <option value="cozinha">
                    Cozinha (Somente pedidos da cozinha KDS)
                  </option>
                  <option value="entregador">
                    Entregador (Entregas atribuídas)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Permissões Específicas (Opcional)
                </label>
                <input
                  type="text"
                  value={permissoesUsr}
                  onChange={(e) => setPermissoesUsr(e.target.value)}
                  placeholder="Deixe vazio para usar padrão da função"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Cadastrar Usuário
              </button>
            </form>
          </div>

          {/* Lista de Usuários */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Funcionários Cadastrados e Controle de Bloqueio
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Nome / E-mail</th>
                    <th className="py-3 px-4">Alterar Função</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {u.nome}
                        </div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={u.funcao}
                          onChange={(e) =>
                            atualizarUsuarioPainelAdmin(u, {
                              funcao: e.target.value as UserRole,
                            })
                          }
                          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="administrador">
                            {formatRoleName('administrador')}
                          </option>
                          <option value="caixa">
                            {formatRoleName('caixa')}
                          </option>
                          <option value="atendente">
                            {formatRoleName('atendente')}
                          </option>
                          <option value="cozinha">
                            {formatRoleName('cozinha')}
                          </option>
                          <option value="entregador">
                            {formatRoleName('entregador')}
                          </option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-xs font-medium">
                        {u.bloqueado ? (
                          <span className="text-red-600">Bloqueado</span>
                        ) : (
                          <span className="text-emerald-700">Ativo</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() =>
                              atualizarUsuarioPainelAdmin(u, {
                                bloqueado: !u.bloqueado,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50"
                          >
                            {u.bloqueado ? (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                Desbloquear
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                Bloquear
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => excluirUsuarioPainelAdmin(u)}
                            className="p-1.5 text-slate-400 hover:text-red-600"
                            title="Remover usuário"
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
          </div>
        </div>
      )}

      {aba === 'configuracoes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-3xl space-y-6">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Preços de Marmitas, Buffet & Dados do Restaurante
          </h2>

          {mensagemSucesso && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg">
              {mensagemSucesso}
            </div>
          )}

          <form onSubmit={handleSalvarConfig} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Restaurante
                </label>
                <input
                  type="text"
                  required
                  value={nomeRest}
                  onChange={(e) => setNomeRest(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={cnpjRest}
                  onChange={(e) => setCnpjRest(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={telRest}
                  onChange={(e) => setTelRest(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Endereço Completo (Exibido no Cupom)
                </label>
                <input
                  type="text"
                  value={endRest}
                  onChange={(e) => setEndRest(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-3">
                Tabela de Preços das Marmitas (Configurável pelo Administrador)
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Marmita Pequena (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={precoP}
                    onChange={(e) => setPrecoP(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Marmita Média (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={precoM}
                    onChange={(e) => setPrecoM(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Marmita Grande (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={precoG}
                    onChange={(e) => setPrecoG(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-3">
                Tabela de Preços do Buffet por Categoria
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Buffet Adulto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={buffetAdulto}
                    onChange={(e) => setBuffetAdulto(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Buffet Criança (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={buffetCrianca}
                    onChange={(e) => setBuffetCrianca(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Buffet por Quilo (R$/kg)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={buffetKilo}
                    onChange={(e) => setBuffetKilo(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={salvandoConfig}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {salvandoConfig
                ? 'Salvando no Firestore...'
                : 'Salvar Alterações de Preços e Configurações'}
            </button>
          </form>
        </div>
      )}

      {aba === 'taxas_ruas' && (
        <div className="space-y-6">
          {/* Card de Cadastro de Nova Rua */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                Cadastrar Taxa de Entrega por Rua ou Bairro
              </h2>
              <p className="text-xs text-slate-500">
                Defina o valor exato da taxa de entrega de acordo com a rua do cliente. O cliente poderá selecionar ou digitar a rua e a taxa será cobrada automaticamente no pedido de delivery.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!nomeRua.trim()) return;
                setSalvandoRua(true);
                try {
                  const valor = parseFloat(taxaRua.replace(',', '.')) || 0;
                  const tempo = parseInt(tempoEstimado, 10) || 30;
                  await criarRegiaoEntrega({
                    nome: nomeRua.trim(),
                    taxa: valor,
                    tempoEstimadoMin: tempo,
                    ativo: true,
                  });
                  setNomeRua('');
                  setTaxaRua('8.00');
                  setTempoEstimado('35');
                } finally {
                  setSalvandoRua(false);
                }
              }}
              className="grid sm:grid-cols-12 gap-3 items-end"
            >
              <div className="sm:col-span-5 space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Nome da Rua / Avenida / Bairro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rua das Palmeiras, Centro, Av. Brasil..."
                  value={nomeRua}
                  onChange={(e) => setNomeRua(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Valor da Taxa (R$) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  placeholder="8.00"
                  value={taxaRua}
                  onChange={(e) => setTaxaRua(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Tempo Estimado (min)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  placeholder="35"
                  value={tempoEstimado}
                  onChange={(e) => setTempoEstimado(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={salvandoRua || !nomeRua.trim()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {salvandoRua ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Ruas e Taxas Cadastradas */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ruas e Regiões Cadastradas ({regioes.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Taxas ativas serão sugeridas ao cliente durante o pedido de delivery
                </p>
              </div>

              <input
                type="text"
                placeholder="Filtrar por nome da rua..."
                value={buscaRua}
                onChange={(e) => setBuscaRua(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg max-w-xs focus:outline-hidden focus:border-amber-600"
              />
            </div>

            {regioes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                <p>Nenhuma rua cadastrada ainda. Adicione ruas acima para configurar as taxas de entrega.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Rua / Bairro / Região</th>
                      <th className="py-3 px-4">Valor da Taxa</th>
                      <th className="py-3 px-4">Tempo de Entrega</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {regioes
                      .filter((r) =>
                        !buscaRua.trim() ||
                        r.nome.toLowerCase().includes(buscaRua.toLowerCase())
                      )
                      .map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {reg.nome}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-700 text-sm">
                            {formatCurrency(reg.taxa)}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            ~{reg.tempoEstimadoMin || 35} minutos
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                atualizarRegiaoEntrega(reg.id, { ativo: !reg.ativo })
                              }
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                                reg.ativo
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {reg.ativo ? 'Ativa no Delivery' : 'Inativa'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Deseja realmente excluir a taxa da rua "${reg.nome}"?`
                                  )
                                ) {
                                  excluirRegiaoEntrega(reg.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir taxa desta rua"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {aba === 'auditoria' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Registro de Operações Críticas (Auditoria de Segurança)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-4">Detalhes</th>
                  <th className="py-3 px-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {[...logsAuditoria]
                  .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
                  .slice(0, 50)
                  .map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.criadoEm)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {log.acao}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {log.detalhes}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {log.usuarioNome}
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
