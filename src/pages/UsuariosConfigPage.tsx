import React, { useState, useEffect } from 'react';
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
  Palette,
  Flame,
  Utensils,
  Crown,
  Zap,
  Soup,
  ChefHat,
  Sparkles,
  Beef,
  Upload,
  Image as ImageIcon,
  Eye,
  Printer,
  Wifi,
  Instagram,
  Facebook,
  PhoneCall,
  Globe,
  Radio,
  AlertCircle,
} from 'lucide-react';
import {
  Usuario,
  UserRole,
  ConfiguracaoRestaurante,
  LogAuditoria,
  RegiaoEntrega,
  ImpressoraTermica,
  SetorImpressao,
} from '../types';
import {
  criarUsuarioPainelAdmin,
  atualizarUsuarioPainelAdmin,
  excluirUsuarioPainelAdmin,
  salvarConfiguracaoRestaurante,
  criarImpressoraTermica,
  atualizarImpressoraTermica,
  excluirImpressoraTermica,
} from '../services/usuariosService';
import {
  criarRegiaoEntrega,
  atualizarRegiaoEntrega,
  excluirRegiaoEntrega,
} from '../services/deliveryService';
import { uploadImagemProduto } from '../services/produtosService';
import { processarImagemParaDataUrl } from '../utils/imagemHelper';
import { IMAGENS_PADRAO } from '../services/firestoreService';
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
  impressoras?: ImpressoraTermica[];
}

export const UsuariosConfigPage: React.FC<UsuariosConfigPageProps> = ({
  usuarios,
  config,
  logsAuditoria,
  regioes = [],
  impressoras = [],
}) => {
  const [aba, setAba] = useState<
    'usuarios' | 'configuracoes' | 'temas_cores' | 'taxas_ruas' | 'impressoras' | 'auditoria'
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

  // Personalização Visual (Logo, Banner, Fundo, Cores, Botões & Ícones)
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(
    config.bannerUrl || IMAGENS_PADRAO.porcaoChurrasco
  );
  const [iconeCustomUrl, setIconeCustomUrl] = useState(config.iconeCustomUrl || '');
  const [tipoIcone, setTipoIcone] = useState<'vetor' | 'imagem'>(
    config.iconeCustomUrl ? 'imagem' : 'vetor'
  );
  const [corPrimaria, setCorPrimaria] = useState(config.corPrimaria || '#e11d48');
  const [corTemaNome, setCorTemaNome] = useState(config.corTemaNome || 'vermelho_kero');
  const [corFundo, setCorFundo] = useState(config.corFundo || '#0b0f19');
  const [corFundoNome, setCorFundoNome] = useState(config.corFundoNome || 'escuro_slate');
  const [corBotoes, setCorBotoes] = useState(config.corBotoes || '#f59e0b');
  const [iconeTema, setIconeTema] = useState(config.iconeTema || 'flame');
  const [salvandoTema, setSalvandoTema] = useState(false);
  const [mensagemTemaSucesso, setMensagemTemaSucesso] = useState('');
  const [erroTema, setErroTema] = useState('');
  const [uploadandoLogo, setUploadandoLogo] = useState(false);
  const [uploadandoBanner, setUploadandoBanner] = useState(false);
  const [uploadandoIcone, setUploadandoIcone] = useState(false);

  // Gerenciamento de Impressoras Térmicas IP por Setor
  const [nomeImpressora, setNomeImpressora] = useState('');
  const [ipImpressora, setIpImpressora] = useState('');
  const [portaImpressora, setPortaImpressora] = useState('9100');
  const [setorImpressora, setSetorImpressora] = useState<SetorImpressao>('cozinha');
  const [larguraBobina, setLarguraBobina] = useState<'80mm' | '58mm'>('80mm');
  const [modeloImpressora, setModeloImpressora] = useState('EPSON ESC/POS');
  const [salvandoImpressora, setSalvandoImpressora] = useState(false);
  const [msgImpressoraSucesso, setMsgImpressoraSucesso] = useState('');
  const [impressoraTestadaId, setImpressoraTestadaId] = useState<string | null>(null);

  // Configurações do Restaurante e Preços
  const [nomeRest, setNomeRest] = useState(config.nomeRestaurante || 'RESTAURANTE KERO');
  const [telRest, setTelRest] = useState(config.telefoneRestaurante || '');
  const [endRest, setEndRest] = useState(config.enderecoRestaurante || '');
  const [cepRest, setCepRest] = useState(config.cep || '');
  const [cnpjRest, setCnpjRest] = useState(config.cnpj || '');
  const [instagramRest, setInstagramRest] = useState(config.instagram || '');
  const [facebookRest, setFacebookRest] = useState(config.facebook || '');
  const [whatsappRest, setWhatsappRest] = useState(config.whatsapp || '');
  const [precoP, setPrecoP] = useState(String(config.precoMarmitaP || 16));
  const [precoM, setPrecoM] = useState(String(config.precoMarmitaM || 20));
  const [precoG, setPrecoG] = useState(String(config.precoMarmitaG || 25));
  const [buffetAdulto, setBuffetAdulto] = useState(
    String(config.precoBuffetAdulto || 30)
  );
  const [buffetCrianca, setBuffetCrianca] = useState(
    String(config.precoBuffetCrianca || 20)
  );
  const [buffetKilo, setBuffetKilo] = useState(
    String(config.precoBuffetKilo || 69.9)
  );
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [erroConfig, setErroConfig] = useState('');

  // Sincroniza os dados com a configuração vinda do banco ou cache
  useEffect(() => {
    if (config) {
      if (config.nomeRestaurante) setNomeRest(config.nomeRestaurante);
      if (config.telefoneRestaurante !== undefined) setTelRest(config.telefoneRestaurante || '');
      if (config.enderecoRestaurante !== undefined) setEndRest(config.enderecoRestaurante || '');
      if (config.cep !== undefined) setCepRest(config.cep || '');
      if (config.cnpj !== undefined) setCnpjRest(config.cnpj || '');
      if (config.instagram !== undefined) setInstagramRest(config.instagram || '');
      if (config.facebook !== undefined) setFacebookRest(config.facebook || '');
      if (config.whatsapp !== undefined) setWhatsappRest(config.whatsapp || '');
      if (config.precoMarmitaP !== undefined) setPrecoP(String(config.precoMarmitaP));
      if (config.precoMarmitaM !== undefined) setPrecoM(String(config.precoMarmitaM));
      if (config.precoMarmitaG !== undefined) setPrecoG(String(config.precoMarmitaG));
      if (config.precoBuffetAdulto !== undefined) setBuffetAdulto(String(config.precoBuffetAdulto));
      if (config.precoBuffetCrianca !== undefined) setBuffetCrianca(String(config.precoBuffetCrianca));
      if (config.precoBuffetKilo !== undefined) setBuffetKilo(String(config.precoBuffetKilo));

      if (config.logoUrl !== undefined) setLogoUrl(config.logoUrl || '');
      if (config.bannerUrl !== undefined) setBannerUrl(config.bannerUrl || '');
      if (config.corPrimaria) setCorPrimaria(config.corPrimaria);
      if (config.corTemaNome) setCorTemaNome(config.corTemaNome);
      if (config.corFundo) setCorFundo(config.corFundo);
      if (config.corFundoNome) setCorFundoNome(config.corFundoNome);
      if (config.corBotoes) setCorBotoes(config.corBotoes);
      if (config.iconeTema) setIconeTema(config.iconeTema);
      if (config.iconeCustomUrl !== undefined) {
        setIconeCustomUrl(config.iconeCustomUrl || '');
        if (config.iconeCustomUrl) setTipoIcone('imagem');
      }
    }
  }, [config]);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadandoLogo(true);
    setErroTema('');
    setErroConfig('');
    try {
      // 1. Converte instantaneamente para Data URL otimizada para preview e gravação garantida
      const dataUrl = await processarImagemParaDataUrl(file, 600, 0.9);
      setLogoUrl(dataUrl);

      // 2. Tenta fazer upload no Firebase Storage em segundo plano (se disponível)
      uploadImagemProduto(file)
        .then((remoteUrl) => {
          if (remoteUrl && remoteUrl.startsWith('http')) {
            setLogoUrl(remoteUrl);
          }
        })
        .catch((err) => {
          console.warn('Utilizando Data URL local otimizada para a logo:', err);
        });
    } catch (err: any) {
      console.error('Erro no processamento da logo:', err);
      setErroTema('Não foi possível carregar a imagem. Tente uma imagem PNG, JPG ou WebP.');
    } finally {
      setUploadandoLogo(false);
      e.target.value = '';
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadandoBanner(true);
    setErroTema('');
    try {
      const dataUrl = await processarImagemParaDataUrl(file, 1400, 0.86);
      setBannerUrl(dataUrl);

      uploadImagemProduto(file)
        .then((remoteUrl) => {
          if (remoteUrl && remoteUrl.startsWith('http')) {
            setBannerUrl(remoteUrl);
          }
        })
        .catch((err) => {
          console.warn('Utilizando Data URL local otimizada para o banner:', err);
        });
    } catch (err: any) {
      console.error('Erro no upload do banner:', err);
      setErroTema('Erro ao carregar o arquivo do banner. Tente outro formato de imagem.');
    } finally {
      setUploadandoBanner(false);
      e.target.value = '';
    }
  };

  const handleUploadIcone = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadandoIcone(true);
    setErroTema('');
    try {
      const dataUrl = await processarImagemParaDataUrl(file, 300, 0.9);
      setIconeCustomUrl(dataUrl);
      setTipoIcone('imagem');

      uploadImagemProduto(file)
        .then((remoteUrl) => {
          if (remoteUrl && remoteUrl.startsWith('http')) {
            setIconeCustomUrl(remoteUrl);
          }
        })
        .catch((err) => {
          console.warn('Utilizando Data URL local para o ícone:', err);
        });
    } catch (err: any) {
      console.error('Erro no upload do ícone:', err);
      setErroTema('Erro ao carregar ícone.');
    } finally {
      setUploadandoIcone(false);
      e.target.value = '';
    }
  };

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
    setErroConfig('');
    try {
      await salvarConfiguracaoRestaurante({
        nomeRestaurante: nomeRest,
        telefoneRestaurante: telRest,
        enderecoRestaurante: endRest,
        cep: cepRest,
        cnpj: cnpjRest,
        instagram: instagramRest,
        facebook: facebookRest,
        whatsapp: whatsappRest,
        precoMarmitaP: parseFloat(precoP.replace(',', '.')) || 20,
        precoMarmitaM: parseFloat(precoM.replace(',', '.')) || 25,
        precoMarmitaG: parseFloat(precoG.replace(',', '.')) || 30,
        precoBuffetAdulto: parseFloat(buffetAdulto.replace(',', '.')) || 44.9,
        precoBuffetCrianca: parseFloat(buffetCrianca.replace(',', '.')) || 24.9,
        precoBuffetKilo: parseFloat(buffetKilo.replace(',', '.')) || 69.9,
        logoUrl,
        bannerUrl,
        corPrimaria,
        corTemaNome,
        corFundo,
        corFundoNome,
        corBotoes,
        iconeTema,
        iconeCustomUrl: tipoIcone === 'imagem' ? iconeCustomUrl : '',
      });
      setMensagemSucesso(
        'Configurações, preços, CEP e redes sociais salvos com sucesso!'
      );
    } catch (err: any) {
      console.error('Erro ao salvar configuração:', err);
      setErroConfig(err?.message || 'Erro ao salvar configurações no servidor.');
    } finally {
      setSalvandoConfig(false);
    }
  };

  const handleSalvarTema = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoTema(true);
    setMensagemTemaSucesso('');
    setErroTema('');
    try {
      await salvarConfiguracaoRestaurante({
        nomeRestaurante: nomeRest,
        telefoneRestaurante: telRest,
        enderecoRestaurante: endRest,
        cep: cepRest,
        cnpj: cnpjRest,
        instagram: instagramRest,
        facebook: facebookRest,
        whatsapp: whatsappRest,
        precoMarmitaP: parseFloat(precoP.replace(',', '.')) || 20,
        precoMarmitaM: parseFloat(precoM.replace(',', '.')) || 25,
        precoMarmitaG: parseFloat(precoG.replace(',', '.')) || 30,
        precoBuffetAdulto: parseFloat(buffetAdulto.replace(',', '.')) || 44.9,
        precoBuffetCrianca: parseFloat(buffetCrianca.replace(',', '.')) || 24.9,
        precoBuffetKilo: parseFloat(buffetKilo.replace(',', '.')) || 69.9,
        logoUrl,
        bannerUrl,
        corPrimaria,
        corTemaNome,
        corFundo,
        corFundoNome,
        corBotoes,
        iconeTema,
        iconeCustomUrl: tipoIcone === 'imagem' ? iconeCustomUrl : '',
      });

      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--cor-primaria', corPrimaria);
        document.documentElement.style.setProperty('--cor-fundo', corFundo);
        document.documentElement.style.setProperty('--cor-botoes', corBotoes);
        const favicon = logoUrl || iconeCustomUrl;
        if (favicon) {
          const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
          if (link) link.href = favicon;
        }
      }

      setMensagemTemaSucesso(
        'Cores e identidade visual salvas e aplicadas com sucesso!'
      );
    } catch (err: any) {
      console.error('Erro ao salvar tema:', err);
      setErroTema(err?.message || 'Erro ao salvar identidade visual no servidor.');
    } finally {
      setSalvandoTema(false);
    }
  };

  // Funções para Impressoras Térmicas IP
  const handleCriarImpressora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeImpressora.trim() || !ipImpressora.trim()) return;
    setSalvandoImpressora(true);
    setMsgImpressoraSucesso('');
    try {
      await criarImpressoraTermica({
        nome: nomeImpressora.trim(),
        ip: ipImpressora.trim(),
        porta: Number(portaImpressora) || 9100,
        setor: setorImpressora,
        larguraBobina,
        modelo: modeloImpressora,
        ativo: true,
      });
      setNomeImpressora('');
      setIpImpressora('');
      setPortaImpressora('9100');
      setMsgImpressoraSucesso('Impressora térmica IP cadastrada com sucesso!');
    } catch (err) {
      console.error('Erro ao cadastrar impressora térmica:', err);
    } finally {
      setSalvandoImpressora(false);
    }
  };

  const handleToggleImpressoraAtivo = async (imp: ImpressoraTermica) => {
    try {
      await atualizarImpressoraTermica(imp.id, { ativo: !imp.ativo });
    } catch (err) {
      console.error('Erro ao alternar status da impressora:', err);
    }
  };

  const handleExcluirImpressora = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a impressora "${nome}"?`)) return;
    try {
      await excluirImpressoraTermica(id);
    } catch (err) {
      console.error('Erro ao excluir impressora:', err);
    }
  };

  const handleTestarImpressora = (imp: ImpressoraTermica) => {
    setImpressoraTestadaId(imp.id);
    setTimeout(() => {
      setImpressoraTestadaId(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Usuários, Permissões & Configurações
          </h1>
          <p className="text-sm text-slate-600">
            Controle administrativo de funcionários, identidade visual (cores/ícones), preços e auditoria
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
            Preços & Dados
          </button>
          <button
            onClick={() => setAba('temas_cores')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              aba === 'temas_cores'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-600" />
            Cores & Ícones
          </button>
          <button
            onClick={() => setAba('impressoras')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              aba === 'impressoras'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            Impressoras IP ({impressoras.length})
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
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {erroConfig && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erroConfig}</span>
            </div>
          )}

          <form onSubmit={handleSalvarConfig} className="space-y-5">
            {/* Imagem da Logo do Restaurante */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  Imagem da Logo do Restaurante
                </label>
                <span className="text-[11px] text-slate-500">
                  Exibida no cabeçalho do Delivery, barra superior e cupons
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Preview Box */}
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative group cursor-pointer hover:border-amber-500 transition-colors">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-1 text-slate-400 group-hover:text-amber-600">
                      <Utensils className="w-6 h-6 mx-auto mb-0.5" />
                      <span className="text-[9px] font-bold block">Carregar</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLogo}
                    className="hidden"
                  />
                </label>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://... ou clique em Carregar Imagem"
                      className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadandoLogo ? 'Processando...' : 'Carregar Imagem'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadLogo}
                        className="hidden"
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-2.5 py-2 border border-slate-300 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg text-xs transition-colors shrink-0"
                        title="Remover logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Selecione um arquivo de imagem do seu computador ou celular (PNG, JPG, SVG, WebP) ou digite um link direto.
                  </p>
                </div>
              </div>
            </div>

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

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Telefone / WhatsApp Principal
                </label>
                <input
                  type="text"
                  value={telRest}
                  onChange={(e) => setTelRest(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CEP do Restaurante
                </label>
                <input
                  type="text"
                  value={cepRest}
                  onChange={(e) => setCepRest(e.target.value)}
                  placeholder="00000-000"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono"
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
                  placeholder="Rua, Número, Bairro, Cidade"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-2">
                Redes Sociais do Restaurante (Aparecem no Site do Cliente & Rodapé)
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={instagramRest}
                    onChange={(e) => setInstagramRest(e.target.value)}
                    placeholder="@restaurantekero"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={facebookRest}
                    onChange={(e) => setFacebookRest(e.target.value)}
                    placeholder="facebook.com/restaurantekero"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    WhatsApp Delivery
                  </label>
                  <input
                    type="text"
                    value={whatsappRest}
                    onChange={(e) => setWhatsappRest(e.target.value)}
                    placeholder="11999999999"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
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

      {/* ABA DE IDENTIDADE VISUAL: CORES, LOGO, BANNER, FUNDO E ÍCONES */}
      {aba === 'temas_cores' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSalvarTema}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-8"
          >
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-600" />
                  Identidade Visual, Logo, Banner, Cores e Ícones do Site
                </h2>
                <p className="text-xs text-slate-500">
                  Personalize a imagem da logo, o banner de apresentação, a cor de fundo, as cores principais e os botões que aparecem para os clientes e no painel interno.
                </p>
              </div>

              {mensagemTemaSucesso && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{mensagemTemaSucesso}</span>
                </div>
              )}

              {erroTema && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{erroTema}</span>
                </div>
              )}
            </div>

            {/* SEÇÃO A: LOGO DO RESTAURANTE & ÍCONE DA BARRA (FAVICON) */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  1. Imagem da Logo do Restaurante & Ícone da Barra Superior / Aba do Navegador
                </label>
                <p className="text-xs text-slate-500">
                  Faça o upload do arquivo de imagem da logo do restaurante ou insira o link direto. Ela será exibida no cabeçalho do site e pode ser usada como ícone oficial da aba.
                </p>
              </div>

              <div className="grid sm:grid-cols-12 gap-4 items-start">
                {/* Preview da Logo */}
                <div className="sm:col-span-4 p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center space-y-2">
                  <label
                    className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden border-2 shadow-md relative cursor-pointer group hover:opacity-90 transition-all"
                    style={{ backgroundColor: corFundo, borderColor: corPrimaria }}
                    title="Clique para escolher uma imagem do seu dispositivo"
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo do Restaurante"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-white">
                        <Utensils className="w-8 h-8 mx-auto opacity-70 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] uppercase font-bold block mt-1">Carregar Logo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                      Alterar
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs font-semibold text-slate-800">
                    {nomeRest || 'Logo Atual'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Aparece no topo do Delivery e do Painel
                  </span>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-medium pt-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover Logo
                    </button>
                  )}
                </div>

                {/* Controles de Upload e URL da Logo */}
                <div className="sm:col-span-8 space-y-3">
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://... URL da logo (PNG, JPG, SVG)"
                      className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600 bg-white"
                    />
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0 shadow-xs">
                      <Upload className="w-4 h-4" />
                      {uploadandoLogo ? 'Processando Imagem...' : 'Carregar Imagem'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadLogo}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <p className="text-xs text-slate-500">
                    Formatos aceitos: <strong>PNG, JPG, JPEG, WEBP e SVG</strong>. A imagem é otimizada e salva permanentemente no sistema.
                  </p>

                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
                    <span>
                      Deseja usar esta logo como o <strong>ícone da barra do site / favicon</strong>?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!logoUrl) {
                          alert('Por favor, carregue a imagem da logo primeiro.');
                          return;
                        }
                        setIconeCustomUrl(logoUrl);
                        setTipoIcone('imagem');
                        const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
                        if (link) link.href = logoUrl;
                        alert('Logo definida como o ícone principal e favicon da barra do site!');
                      }}
                      className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 text-xs shrink-0 shadow-xs"
                    >
                      Usar Logo na Barra
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO B: BANNER DO RESTAURANTE (PARTE QUE APARECE PARA O CLIENTE) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  2. Banner do Restaurante (Vitrine Superior que Aparece para o Cliente)
                </label>
                <p className="text-xs text-slate-500">
                  Configure o banner ilustrativo de capa do restaurante com seus pratos, churrasco ou identidade. O cliente vê esta imagem logo ao abrir o site.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://... URL do Banner do Restaurante"
                    className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0">
                    <Upload className="w-4 h-4" />
                    {uploadandoBanner ? 'Enviando...' : 'Carregar Banner'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadBanner}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Pré-visualização do Banner Panorâmico */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md h-40 sm:h-52 w-full bg-slate-900">
                  <img
                    src={bannerUrl || IMAGENS_PADRAO.porcaoChurrasco}
                    alt="Banner do Restaurante"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Pré-visualização do Banner do Cliente
                    </span>
                    <h3 className="text-lg sm:text-2xl font-extrabold font-display">
                      {nomeRest || 'RESTAURANTE KERO'}
                    </h3>
                    <p className="text-xs text-slate-200 max-w-lg line-clamp-1">
                      Marmitas na Brasa, Carnes Especiais & Self-Service — Faça seu pedido online!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO C: COR DO FUNDO DO SITE */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-900">
                  3. Cor do Fundo do Site (Background Principal)
                </label>
                <p className="text-xs text-slate-500">
                  Altere a cor de fundo do site. Pode ser o tom escuro gastronômico, preto total, café escuro ou uma cor personalizada.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { id: 'escuro_slate', nome: 'Slate Escuro', hex: '#0b0f19', desc: 'Moderno & escuro' },
                  { id: 'preto_puro', nome: 'Preto Total', hex: '#000000', desc: 'Preto absoluto OLED' },
                  { id: 'cafe_brasa', nome: 'Café & Brasa', hex: '#18120c', desc: 'Rústico churrascaria' },
                  { id: 'azul_noite', nome: 'Azul Noturno', hex: '#0a1128', desc: 'Elegante & sereno' },
                  { id: 'grafite_onix', nome: 'Grafite Ônix', hex: '#18181b', desc: 'Neutro escuro' },
                  { id: 'claro_suave', nome: 'Claro Suave', hex: '#f8fafc', desc: 'Tema claro suave' },
                ].map((item) => {
                  const selecionado = corFundo.toLowerCase() === item.hex.toLowerCase();
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCorFundo(item.hex);
                        setCorFundoNome(item.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        selecionado
                          ? 'border-amber-500 shadow-md ring-2 ring-amber-500/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      style={{ backgroundColor: item.hex }}
                    >
                      <div className="text-xs font-bold leading-tight" style={{ color: item.hex === '#f8fafc' ? '#0f172a' : '#ffffff' }}>
                        {item.nome}
                      </div>
                      <div className="text-[10px] font-mono mt-1 opacity-75" style={{ color: item.hex === '#f8fafc' ? '#475569' : '#94a3b8' }}>
                        {item.hex}
                      </div>
                      {selecionado && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Seletor Livre de Cor de Fundo */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={corFundo}
                    onChange={(e) => {
                      setCorFundo(e.target.value);
                      setCorFundoNome('personalizado');
                    }}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Cor de Fundo Personalizada (HEX):
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase">
                      {corFundo}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  Clique na caixinha de cor para escolher qualquer cor de fundo.
                </span>
              </div>
            </div>

            {/* SEÇÃO D: CORES PRINCIPAIS DO SITE (TEMA PREDOMINANTE) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-900">
                  4. Cores Principais do Site (Destaques & Identidade Visual)
                </label>
                <p className="text-xs text-slate-500">
                  Selecione a cor que dá vida aos títulos, badges, ícones e destaques do cardápio.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    id: 'vermelho_kero',
                    nome: 'Vermelho Kero',
                    hex: '#e11d48',
                    desc: 'Vibrante e gastronômico',
                  },
                  {
                    id: 'laranja_brasa',
                    nome: 'Laranja Brasa',
                    hex: '#ea580c',
                    desc: 'Churrascaria & grill',
                  },
                  {
                    id: 'ambar_dourado',
                    nome: 'Âmbar Dourado',
                    hex: '#d97706',
                    desc: 'Clássico acolhedor',
                  },
                  {
                    id: 'verde_esmeralda',
                    nome: 'Verde Esmeralda',
                    hex: '#059669',
                    desc: 'Fresco e natural',
                  },
                  {
                    id: 'azul_royal',
                    nome: 'Azul Royal',
                    hex: '#2563eb',
                    desc: 'Moderno e executivo',
                  },
                  {
                    id: 'roxo_ametista',
                    nome: 'Roxo Ametista',
                    hex: '#7c3aed',
                    desc: 'Gourmet e sofisticado',
                  },
                  {
                    id: 'rosa_magenta',
                    nome: 'Rosa Magenta',
                    hex: '#db2777',
                    desc: 'Alegre e contemporâneo',
                  },
                  {
                    id: 'grafite_onix',
                    nome: 'Grafite & Ônix',
                    hex: '#1e293b',
                    desc: 'Minimalista & premium',
                  },
                ].map((cor) => {
                  const selecionada =
                    corPrimaria.toLowerCase() === cor.hex.toLowerCase() ||
                    corTemaNome === cor.id;
                  return (
                    <button
                      key={cor.id}
                      type="button"
                      onClick={() => {
                        setCorPrimaria(cor.hex);
                        setCorTemaNome(cor.id);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        selecionada
                          ? 'border-slate-900 shadow-md ring-2 ring-slate-900/20 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-6 h-6 rounded-full border border-black/10 shadow-inner shrink-0"
                          style={{ backgroundColor: cor.hex }}
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 leading-tight">
                            {cor.nome}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {cor.hex}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2">
                        {cor.desc}
                      </div>
                      {selecionada && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Seletor Customizado HEX Principal */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={corPrimaria}
                    onChange={(e) => {
                      setCorPrimaria(e.target.value);
                      setCorTemaNome('personalizado');
                    }}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Cor Principal Livre (HEX):
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase">
                      {corPrimaria}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  Destaques visuais e cabeçalhos da página.
                </span>
              </div>
            </div>

            {/* SEÇÃO E: COR DOS BOTÕES DO SITE */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-900">
                  5. Cores dos Botões (Comprar, Adicionar na Sacola & Ações)
                </label>
                <p className="text-xs text-slate-500">
                  Defina a cor dos botões de ação do site (como o botão de Adicionar à Sacola, Finalizar Pedido, etc.).
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { id: 'ouro_amber', nome: 'Âmbar Dourado', hex: '#f59e0b', desc: 'Chama a atenção' },
                  { id: 'vermelho_brasa', nome: 'Vermelho Brasa', hex: '#e11d48', desc: 'Fome & ação' },
                  { id: 'laranja_fogo', nome: 'Laranja Fogo', hex: '#ea580c', desc: 'Aperitivo & grill' },
                  { id: 'verde_esmeralda', nome: 'Verde Esmeralda', hex: '#10b981', desc: 'Compra & WhatsApp' },
                  { id: 'azul_royal', nome: 'Azul Royal', hex: '#2563eb', desc: 'Confiante' },
                  { id: 'roxo_nobre', nome: 'Roxo Nobre', hex: '#7c3aed', desc: 'Gourmet' },
                ].map((b) => {
                  const selecionado = corBotoes.toLowerCase() === b.hex.toLowerCase();
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setCorBotoes(b.hex)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        selecionado
                          ? 'border-slate-900 shadow-md ring-2 ring-slate-900/20 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: b.hex }}
                        />
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {b.nome}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        {b.hex}
                      </div>
                      {selecionado && (
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Seletor Customizado HEX de Botões */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={corBotoes}
                    onChange={(e) => setCorBotoes(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Cor dos Botões Personalizada (HEX):
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase">
                      {corBotoes}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 shadow-md"
                    style={{ backgroundColor: corBotoes }}
                  >
                    Exemplo de Botão
                  </button>
                </div>
              </div>
            </div>

            {/* SEÇÃO F: ÍCONE DA MARCA & BARRA DO SITE */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-900">
                  6. Ícone Temático do Restaurante
                </label>
                <p className="text-xs text-slate-500">
                  Este ícone é exibido nos destaques e na barra lateral quando nenhuma logo com imagem for carregada.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'flame', label: 'Fogo & Brasa', icon: Flame, desc: 'Churrasqueira & calor' },
                  { id: 'beef', label: 'Carnes & Churrasco', icon: Beef, desc: 'Especialista em carnes' },
                  { id: 'utensils', label: 'Talheres & Salão', icon: Utensils, desc: 'Restaurante & buffet' },
                  { id: 'crown', label: 'Coroa Kero', icon: Crown, desc: 'Qualidade nobre' },
                  { id: 'zap', label: 'Raio Rápido', icon: Zap, desc: 'Entrega ágil e express' },
                  { id: 'soup', label: 'Marmita Quente', icon: Soup, desc: 'Almoço caseiro' },
                  { id: 'chef-hat', label: 'Chapéu de Chef', icon: ChefHat, desc: 'Culinária artesanal' },
                  { id: 'sparkles', label: 'Estrela Kero', icon: Sparkles, desc: 'Destaque e sabor' },
                ].map((item) => {
                  const IconComp = item.icon;
                  const selecionado = iconeTema === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIconeTema(item.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        selecionado
                          ? 'border-slate-900 shadow-md ring-2 ring-slate-900/20 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: `${corPrimaria}20`,
                            color: corPrimaria,
                          }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      {selecionado && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO G: PRÉ-VISUALIZAÇÃO AO VIVO INTEGRADA */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-900">
                7. Pré-visualização ao Vivo do Site com as Suas Escolhas
              </label>

              <div
                className="p-5 rounded-2xl text-white border border-slate-800 space-y-4 shadow-xl transition-all"
                style={{ backgroundColor: corFundo }}
              >
                {/* Header Simulado */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md overflow-hidden border border-white/20"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo Simulado"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Flame className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold font-display">
                        {nomeRest || 'RESTAURANTE KERO'}
                      </h4>
                      <p className="text-xs text-white/70">
                        {endRest || 'Rua Gastronômica'} {cepRest ? `· CEP ${cepRest}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 shadow-md transition-transform active:scale-95"
                      style={{ backgroundColor: corBotoes }}
                    >
                      Botão de Comprar / Sacola
                    </button>
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: `${corPrimaria}30`,
                        color: corPrimaria,
                        border: `1px solid ${corPrimaria}60`,
                      }}
                    >
                      Destaque do Dia
                    </span>
                  </div>
                </div>

                <div className="text-xs text-white/70 flex flex-wrap items-center gap-4">
                  <span>Fundo: <strong className="font-mono text-white">{corFundo}</strong></span>
                  <span>· Principal: <strong className="font-mono text-white">{corPrimaria}</strong></span>
                  <span>· Botões: <strong className="font-mono text-white">{corBotoes}</strong></span>
                  <span>· Ícone/Logo na Barra: <strong className="text-white">{logoUrl ? 'Logo Própria Ativa' : iconeTema}</strong></span>
                </div>
              </div>
            </div>

            {mensagemTemaSucesso && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{mensagemTemaSucesso}</span>
              </div>
            )}

            {erroTema && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{erroTema}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Todas as alterações de cores, logo e banner são gravadas e mantidas de forma permanente.
              </span>

              <button
                type="submit"
                disabled={salvandoTema}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-slate-950 text-sm font-extrabold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0"
                style={{ backgroundColor: corBotoes }}
              >
                <Save className="w-4 h-4" />
                {salvandoTema ? 'Salvando...' : 'Salvar Identidade Visual Completa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ABA DE GERENCIAMENTO DE IMPRESSORAS TÉRMICAS VIA IP */}
      {aba === 'impressoras' && (
        <div className="space-y-6">
          {/* Card de Cadastro de Nova Impressora */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Cadastrar Nova Impressora Térmica via IP
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre e vincule impressoras térmicas ESC/POS conectadas na rede local (Wi-Fi ou Cabo Ethernet) e defina qual impressora imprime cada setor específico do restaurante.
              </p>
            </div>

            {msgImpressoraSucesso && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{msgImpressoraSucesso}</span>
              </div>
            )}

            <form onSubmit={handleCriarImpressora} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nome / Identificação da Impressora *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeImpressora}
                    onChange={(e) => setNomeImpressora(e.target.value)}
                    placeholder="Ex: Epson Cozinha Quente"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-blue-600" />
                    Endereço IP na Rede Local *
                  </label>
                  <input
                    type="text"
                    required
                    value={ipImpressora}
                    onChange={(e) => setIpImpressora(e.target.value)}
                    placeholder="Ex: 192.168.1.200"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Porta TCP (Padrão 9100)
                  </label>
                  <input
                    type="number"
                    value={portaImpressora}
                    onChange={(e) => setPortaImpressora(e.target.value)}
                    placeholder="9100"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Setor de Impressão (Destino dos Pedidos) *
                  </label>
                  <select
                    value={setorImpressora}
                    onChange={(e) => setSetorImpressora(e.target.value as SetorImpressao)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="cozinha">🍳 Cozinha KDS (Marmitas & Pratos Quentes)</option>
                    <option value="caixa">💵 Caixa & Balcão (Cupons Fiscais & Vendas)</option>
                    <option value="bar">🍹 Bar & Bebidas (Comandas de Bebidas)</option>
                    <option value="todos">🌐 Todos os Setores (Geral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Largura da Bobina Térmica
                  </label>
                  <select
                    value={larguraBobina}
                    onChange={(e) => setLarguraBobina(e.target.value as '80mm' | '58mm')}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="80mm">80 mm (Padrão Comercial 48 colunas)</option>
                    <option value="58mm">58 mm (Compacta 32 colunas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Modelo / Fabricante
                  </label>
                  <input
                    type="text"
                    value={modeloImpressora}
                    onChange={(e) => setModeloImpressora(e.target.value)}
                    placeholder="Ex: Epson TM-T20X / Bematech MP-4200"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={salvandoImpressora}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {salvandoImpressora ? 'Cadastrando...' : 'Cadastrar Impressora Térmica'}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Impressoras Cadastradas */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                Impressoras Térmicas Configuradas ({impressoras.length})
              </h3>
              <span className="text-xs text-slate-500">
                As impressões de cada setor são direcionadas automaticamente para o IP cadastrado
              </span>
            </div>

            {impressoras.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Printer className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium text-slate-700">
                  Nenhuma impressora térmica IP cadastrada ainda.
                </p>
                <p className="text-xs text-slate-500">
                  Preencha o formulário acima para cadastrar a impressora da Cozinha, do Caixa ou do Bar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {impressoras.map((imp) => {
                  const estaTestando = impressoraTestadaId === imp.id;
                  return (
                    <div
                      key={imp.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {imp.nome}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              imp.setor === 'cozinha'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : imp.setor === 'caixa'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : imp.setor === 'bar'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            Setor: {imp.setor}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            Bobina {imp.larguraBobina || '80mm'}
                          </span>
                          {imp.ativo ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Ativa
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">
                              Inativa
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Wifi className="w-3.5 h-3.5 text-blue-600" />
                            {imp.ip}:{imp.porta || 9100}
                          </span>
                          <span>·</span>
                          <span>{imp.modelo || 'ESC/POS'}</span>
                        </div>

                        {estaTestando && (
                          <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-bounce">
                            <Check className="w-4 h-4 text-emerald-600" />
                            Comando ESC/POS enviado para {imp.ip}:{imp.porta} — Comunicação e guilhotina OK!
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTestarImpressora(imp)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                          title="Enviar comando de teste para a impressora IP"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Testar Impressão
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleImpressoraAtivo(imp)}
                          className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
                            imp.ativo
                              ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {imp.ativo ? 'Desativar' : 'Ativar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExcluirImpressora(imp.id, imp.nome)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir impressora"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
