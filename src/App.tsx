/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import {
  ensureUserProfile,
  logoutUser,
} from './services/authService';
import {
  subscribeCollection,
  inicializarDadosDemonstracao,
  inicializarBancoDeDadosReal,
  converterDemonstracaoParaReal,
  sincronizarCardapioCompletoOficial,
  CONFIG_PADRAO,
} from './services/firestoreService';
import {
  Usuario,
  UserRole,
  Produto,
  Mesa,
  Comanda,
  ItemComanda,
  Pedido,
  ItemPedido,
  Pagamento,
  Caixa,
  MovimentacaoCaixa,
  Entregador,
  Entrega,
  RegiaoEntrega,
  PedidoCozinha,
  ConfiguracaoRestaurante,
  Cliente,
  LogAuditoria,
  ImpressoraTermica,
  ThermalReceiptData,
} from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ThermalPrintModal } from './components/ThermalPrintModal';
import { ModalInicializarBanco } from './components/ModalInicializarBanco';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarmitasPage } from './pages/MarmitasPage';
import { DeliveryClientePage } from './pages/DeliveryClientePage';
import { DeliveryKanbanPage } from './pages/DeliveryKanbanPage';
import { PedidosPage } from './pages/PedidosPage';
import { MesasPage } from './pages/MesasPage';
import { ComandasBuffetPage } from './pages/ComandasBuffetPage';
import { CozinhaKDSPage } from './pages/CozinhaKDSPage';
import { CaixaPage } from './pages/CaixaPage';
import { CardapioPage } from './pages/CardapioPage';
import { ClientesEntregadoresPage } from './pages/ClientesEntregadoresPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { UsuariosConfigPage } from './pages/UsuariosConfigPage';
import { PortalClienteDelivery } from './pages/PortalClienteDelivery';
import { ModalCompartilharLinkCliente } from './components/ModalCompartilharLinkCliente';

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [roleSimulada, setRoleSimulada] = useState<UserRole>('administrador');
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [comandaSelecionadaId, setComandaSelecionadaId] = useState<string | null>(
    null
  );
  const [receiptParaImprimir, setReceiptParaImprimir] =
    useState<ThermalReceiptData | null>(null);
  const [modalBancoAberto, setModalBancoAberto] = useState(false);
  const [modalCompartilharLink, setModalCompartilharLink] = useState(false);
  const [modoClienteForcado, setModoClienteForcado] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return (
      params.has('portal') ||
      params.has('modo') ||
      params.has('cliente') ||
      params.has('delivery') ||
      window.location.hash.includes('cardapio') ||
      window.location.hash.includes('cliente')
    );
  });

  // Estados sincronizados em tempo real com o Cloud Firestore
  const [configList, setConfigList] = useState<ConfiguracaoRestaurante[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [itensComanda, setItensComanda] = useState<ItemComanda[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [movimentacoesCaixa, setMovimentacoesCaixa] = useState<
    MovimentacaoCaixa[]
  >([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [regioesEntrega, setRegioesEntrega] = useState<RegiaoEntrega[]>([]);
  const [pedidosCozinha, setPedidosCozinha] = useState<PedidoCozinha[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [logsAuditoria, setLogsAuditoria] = useState<LogAuditoria[]>([]);
  const [impressoras, setImpressoras] = useState<ImpressoraTermica[]>([]);

  // 1. Monitorar estado de autenticação do Firebase
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const perfil = await ensureUserProfile(fbUser);
          setUsuarioAtual(perfil);
          setRoleSimulada(perfil.funcao);
        } catch (err) {
          console.error('Erro ao carregar perfil do usuário:', err);
        }
      } else {
        setUsuarioAtual(null);
      }
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  // 2. Assinar coleções em tempo real (públicas para clientes e operacionais para equipe)
  useEffect(() => {
    if (!authReady) return;

    // Coleções públicas com leitura aberta para clientes e delivery online
    const publicUnsubs = [
      subscribeCollection<ConfiguracaoRestaurante>('configuracoes', setConfigList),
      subscribeCollection<Produto>('produtos', setProdutos),
      subscribeCollection<RegiaoEntrega>('regioesEntrega', setRegioesEntrega),
    ];

    if (!usuarioAtual) {
      return () => {
        publicUnsubs.forEach((u) => u());
      };
    }

    // Coleções operacionais do restaurante para equipe autenticada
    const staffUnsubs = [
      subscribeCollection<Mesa>('mesas', setMesas),
      subscribeCollection<Comanda>('comandas', setComandas),
      subscribeCollection<ItemComanda>('itensComanda', setItensComanda),
      subscribeCollection<Pedido>('pedidos', setPedidos),
      subscribeCollection<ItemPedido>('itensPedido', setItensPedido),
      subscribeCollection<Pagamento>('pagamentos', setPagamentos),
      subscribeCollection<Caixa>('caixas', setCaixas),
      subscribeCollection<MovimentacaoCaixa>(
        'movimentacoesCaixa',
        setMovimentacoesCaixa
      ),
      subscribeCollection<Entregador>('entregadores', setEntregadores),
      subscribeCollection<Entrega>('entregas', setEntregas),
      subscribeCollection<PedidoCozinha>('pedidosCozinha', setPedidosCozinha),
      subscribeCollection<Usuario>('usuarios', setUsuarios),
      subscribeCollection<Cliente>('clientes', setClientes),
      subscribeCollection<LogAuditoria>('logsAuditoria', setLogsAuditoria),
      subscribeCollection<ImpressoraTermica>('impressoras', setImpressoras),
    ];

    return () => {
      publicUnsubs.forEach((u) => u());
      staffUnsubs.forEach((u) => u());
    };
  }, [authReady, usuarioAtual]);

  // Ajustar tela inicial se mudar a função simulada no RBAC
  const handleChangeRoleSimulada = (novaRole: UserRole) => {
    setRoleSimulada(novaRole);
    if (novaRole === 'cozinha') {
      setActiveTab('cozinha');
    } else if (novaRole === 'entregador') {
      setActiveTab('clientes_entregadores');
    } else if (novaRole === 'atendente') {
      setActiveTab('mesas');
    } else if (novaRole === 'caixa') {
      setActiveTab('caixa');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      await inicializarDadosDemonstracao();
    } finally {
      setSeeding(false);
    }
  };

  const handleIniciarBancoReal = async () => {
    setSeeding(true);
    try {
      await inicializarBancoDeDadosReal(true);
    } finally {
      setSeeding(false);
    }
  };

  const handleConverterDemoParaReal = async () => {
    try {
      await converterDemonstracaoParaReal();
    } catch (err) {
      console.error('Erro ao converter demo para real:', err);
    }
  };

  const temDadosDemo = produtos.some(
    (p) => p.ehDadoDemonstracao || p.nome.includes('[Demo]')
  );

  // Se houver dados com etiqueta [Demo] no banco, converte automaticamente para o banco real limpo
  useEffect(() => {
    if (temDadosDemo && authReady && usuarioAtual) {
      converterDemonstracaoParaReal().catch((err) =>
        console.warn('Erro ao converter demo para real automaticamente:', err)
      );
    }
  }, [temDadosDemo, authReady, usuarioAtual]);

  // Se o cardápio oficial solicitado ainda não estiver carregado, sincroniza automaticamente
  useEffect(() => {
    if (authReady && usuarioAtual) {
      const temCardapioOficial = produtos.some(
        (p) => p.nome === 'Coca-Cola Lata' || p.nome === 'Marmita Pequena'
      );
      if (!temCardapioOficial && produtos.length < 10) {
        sincronizarCardapioCompletoOficial().catch((err) =>
          console.warn('Erro ao sincronizar cardápio oficial na inicialização:', err)
        );
      }
    }
  }, [authReady, usuarioAtual, produtos]);

  const configSalvaLocal = useMemo(() => {
    try {
      const item = localStorage.getItem('kero_configuracao_local');
      if (item) return JSON.parse(item);
    } catch {
      // ignore
    }
    return null;
  }, []);

  const configDoc = configList.find((c) => c.id === 'geral') || configList[0];
  const configAtual: ConfiguracaoRestaurante = useMemo(() => {
    return {
      ...CONFIG_PADRAO,
      ...(configSalvaLocal || {}),
      ...(configDoc || {}),
    };
  }, [configDoc, configSalvaLocal]);

  // Atualizar variáveis CSS globais, título da aba e favicon
  useEffect(() => {
    if (configAtual.corPrimaria) {
      document.documentElement.style.setProperty('--cor-primaria', configAtual.corPrimaria);
    }
    if (configAtual.corFundo) {
      document.documentElement.style.setProperty('--cor-fundo', configAtual.corFundo);
    }
    if (configAtual.corBotoes) {
      document.documentElement.style.setProperty('--cor-botoes', configAtual.corBotoes);
    }
    if (configAtual.nomeRestaurante) {
      document.title = `${configAtual.nomeRestaurante} — Sistema de Gestão & Delivery`;
    }
    const faviconUrl = configAtual.logoUrl || configAtual.iconeCustomUrl;
    if (faviconUrl) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = faviconUrl;
      }
    }
  }, [configAtual]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="text-lg font-bold font-display">
            Sabor & Brasa — Sistema de Gestão
          </div>
          <div className="text-xs text-slate-400">
            Conectando ao Cloud Firestore e verificando credenciais...
          </div>
        </div>
      </div>
    );
  }

  // Se estiver no portal do cliente (link direto para pedidos delivery)
  if (modoClienteForcado) {
    return (
      <ErrorBoundary>
        <PortalClienteDelivery
          produtos={produtos}
          regioes={regioesEntrega}
          config={configAtual}
          pedidos={pedidos}
          onIrParaLogin={() => {
            setModoClienteForcado(false);
            if (typeof window !== 'undefined') {
              window.history.pushState(null, '', window.location.pathname);
            }
          }}
        />
      </ErrorBoundary>
    );
  }

  if (!usuarioAtual) {
    return (
      <ErrorBoundary>
        <LoginPage
          onAbrirCardapioCliente={() => {
            setModoClienteForcado(true);
            if (typeof window !== 'undefined') {
              window.history.pushState(
                null,
                '',
                `${window.location.pathname}?portal=cliente`
              );
            }
          }}
        />
      </ErrorBoundary>
    );
  }

  if (usuarioAtual.bloqueado) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-4">
          <h2 className="text-lg font-bold text-red-400">
            Acesso Temporariamente Bloqueado
          </h2>
          <p className="text-xs text-slate-300">
            Sua conta de operador está marcada como bloqueada pelo Administrador.
          </p>
          <button
            onClick={() => logoutUser()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  const caixaAberto = caixas.find((c) => c.status === 'aberto') || null;

  const kdsCount = pedidosCozinha.filter(
    (k) => k.status === 'novo' || k.status === 'em_preparo'
  ).length;

  const deliveryNovosCount = pedidos.filter(
    (p) =>
      p.origem === 'delivery' &&
      (p.status === 'novo' || p.status === 'confirmando')
  ).length;

  const handleOpenComandaFromMesa = (comandaId: string) => {
    setComandaSelecionadaId(comandaId);
    setActiveTab('comandas');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <TopBar
          nomeRestaurante={configAtual.nomeRestaurante}
          corPrimaria={configAtual.corPrimaria}
          iconeTema={configAtual.iconeTema}
          logoUrl={configAtual.logoUrl}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenBancoModal={() => setModalBancoAberto(true)}
          onOpenLinkClienteModal={() => setModalCompartilharLink(true)}
        />

        <div className="flex flex-1">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            usuarioAtual={usuarioAtual}
            roleSimulada={roleSimulada}
            onChangeRoleSimulada={handleChangeRoleSimulada}
            onLogout={logoutUser}
            kdsCount={kdsCount}
            deliveryNovosCount={deliveryNovosCount}
            mobileOpen={mobileMenuOpen}
            setMobileOpen={setMobileMenuOpen}
            corPrimaria={configAtual.corPrimaria}
            iconeTema={configAtual.iconeTema}
            nomeRestaurante={configAtual.nomeRestaurante}
            logoUrl={configAtual.logoUrl}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto overflow-x-hidden">
            {activeTab === 'dashboard' && (
              <DashboardPage
                pedidos={pedidos}
                mesas={mesas}
                comandas={comandas}
                pagamentos={pagamentos}
                pedidosCozinha={pedidosCozinha}
                temDadosDemo={temDadosDemo}
                onNavigate={setActiveTab}
                onOpenBancoModal={() => setModalBancoAberto(true)}
                onIniciarBancoReal={handleIniciarBancoReal}
                onConverterDemoParaReal={handleConverterDemoParaReal}
                onOpenLinkClienteModal={() => setModalCompartilharLink(true)}
              />
            )}

            {activeTab === 'marmitas' && (
              <MarmitasPage
                produtos={produtos}
                config={configAtual}
                pedidos={pedidos}
                onPrintReceipt={setReceiptParaImprimir}
              />
            )}

            {activeTab === 'delivery_cliente' && (
              <DeliveryClientePage
                produtos={produtos}
                regioes={regioesEntrega}
                config={configAtual}
                pedidos={pedidos}
              />
            )}

            {activeTab === 'delivery_painel' && (
              <DeliveryKanbanPage
                pedidos={pedidos}
                entregadores={entregadores}
                regioes={regioesEntrega}
                caixaAberto={caixaAberto}
                ehAdmin={roleSimulada === 'administrador'}
                onPrintReceipt={setReceiptParaImprimir}
                onOpenLinkClienteModal={() => setModalCompartilharLink(true)}
              />
            )}

            {activeTab === 'pedidos' && (
              <PedidosPage
                pedidos={pedidos}
                itensPedido={itensPedido}
                caixaAberto={caixaAberto}
                onPrintReceipt={setReceiptParaImprimir}
              />
            )}

            {activeTab === 'mesas' && (
              <MesasPage
                mesas={mesas}
                comandas={comandas}
                config={configAtual}
                onOpenComanda={handleOpenComandaFromMesa}
              />
            )}

            {activeTab === 'comandas' && (
              <ComandasBuffetPage
                comandas={comandas}
                itensComanda={itensComanda}
                mesas={mesas}
                produtos={produtos}
                config={configAtual}
                caixaAberto={caixaAberto}
                comandaSelecionadaId={comandaSelecionadaId}
                onSelectComandaId={setComandaSelecionadaId}
                onPrintReceipt={setReceiptParaImprimir}
              />
            )}

            {activeTab === 'cozinha' && (
              <CozinhaKDSPage
                pedidosCozinha={pedidosCozinha}
                pedidos={pedidos}
                onPrintReceipt={setReceiptParaImprimir}
              />
            )}

            {activeTab === 'caixa' && (
              <CaixaPage
                caixas={caixas}
                movimentacoes={movimentacoesCaixa}
                caixaAberto={caixaAberto}
                onPrintReceipt={setReceiptParaImprimir}
              />
            )}

            {activeTab === 'cardapio' && (
              <CardapioPage
                produtos={produtos}
                ehAdmin={roleSimulada === 'administrador'}
              />
            )}

            {activeTab === 'clientes_entregadores' && (
              <ClientesEntregadoresPage
                entregadores={entregadores}
                entregas={entregas}
                clientes={clientes}
                pedidos={pedidos}
                caixaAberto={caixaAberto}
              />
            )}

            {activeTab === 'relatorios' && (
              <RelatoriosPage
                pedidos={pedidos}
                itensPedido={itensPedido}
                comandas={comandas}
                itensComanda={itensComanda}
                pagamentos={pagamentos}
                onPrintReceipt={setReceiptParaImprimir}
              />
            )}

            {activeTab === 'usuarios_config' && (
              <UsuariosConfigPage
                usuarios={usuarios}
                config={configAtual}
                logsAuditoria={logsAuditoria}
                regioes={regioesEntrega}
                impressoras={impressoras}
              />
            )}
          </main>
        </div>

        <ThermalPrintModal
          receipt={receiptParaImprimir}
          nomeRestaurante={configAtual.nomeRestaurante}
          cnpjRestaurante={configAtual.cnpj}
          enderecoRestaurante={configAtual.enderecoRestaurante}
          telefoneRestaurante={configAtual.telefoneRestaurante}
          onClose={() => setReceiptParaImprimir(null)}
        />

        <ModalInicializarBanco
          aberto={modalBancoAberto}
          onClose={() => setModalBancoAberto(false)}
          temDadosDemo={temDadosDemo}
          totalProdutos={produtos.length}
          totalMesas={mesas.length}
        />

        <ModalCompartilharLinkCliente
          aberto={modalCompartilharLink}
          onClose={() => setModalCompartilharLink(false)}
          nomeRestaurante={configAtual.nomeRestaurante}
          onVerComoCliente={() => {
            setModalCompartilharLink(false);
            setModoClienteForcado(true);
            if (typeof window !== 'undefined') {
              window.history.pushState(
                null,
                '',
                `${window.location.pathname}?portal=cliente`
              );
            }
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
