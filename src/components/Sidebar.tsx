import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Columns3,
  ClipboardList,
  Grid,
  Receipt,
  ChefHat,
  Wallet,
  BookOpen,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Usuario, UserRole } from '../types';
import { formatRoleName } from '../utils/formatters';

export type NavigationTab =
  | 'dashboard'
  | 'marmitas'
  | 'delivery_cliente'
  | 'delivery_painel'
  | 'pedidos'
  | 'mesas'
  | 'comandas'
  | 'cozinha'
  | 'caixa'
  | 'cardapio'
  | 'clientes_entregadores'
  | 'relatorios'
  | 'usuarios_config';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  usuarioAtual: Usuario;
  roleSimulada: UserRole;
  onChangeRoleSimulada: (role: UserRole) => void;
  onLogout: () => void;
  kdsCount: number;
  deliveryNovosCount: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface MenuItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  rolesPermitidas: UserRole[];
  contador?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  usuarioAtual,
  roleSimulada,
  onChangeRoleSimulada,
  onLogout,
  kdsCount,
  deliveryNovosCount,
  mobileOpen,
  setMobileOpen,
}) => {
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      rolesPermitidas: ['administrador', 'caixa'],
    },
    {
      id: 'marmitas',
      label: 'Venda de Marmitas',
      icon: UtensilsCrossed,
      rolesPermitidas: ['administrador', 'atendente', 'caixa'],
    },
    {
      id: 'delivery_cliente',
      label: 'Delivery (Cliente iFood)',
      icon: ShoppingBag,
      rolesPermitidas: ['administrador', 'atendente', 'caixa', 'entregador'],
    },
    {
      id: 'delivery_painel',
      label: 'Painel Delivery Kanban',
      icon: Columns3,
      rolesPermitidas: ['administrador', 'atendente', 'caixa', 'entregador'],
      contador: deliveryNovosCount,
    },
    {
      id: 'pedidos',
      label: 'Pedidos',
      icon: ClipboardList,
      rolesPermitidas: ['administrador', 'atendente', 'caixa'],
    },
    {
      id: 'mesas',
      label: 'Mesas',
      icon: Grid,
      rolesPermitidas: ['administrador', 'atendente', 'caixa'],
    },
    {
      id: 'comandas',
      label: 'Comandas & Buffet',
      icon: Receipt,
      rolesPermitidas: ['administrador', 'atendente', 'caixa'],
    },
    {
      id: 'cozinha',
      label: 'Cozinha (KDS)',
      icon: ChefHat,
      rolesPermitidas: ['administrador', 'cozinha', 'atendente'],
      contador: kdsCount,
    },
    {
      id: 'caixa',
      label: 'Caixa (PDV)',
      icon: Wallet,
      rolesPermitidas: ['administrador', 'caixa'],
    },
    {
      id: 'cardapio',
      label: 'Cardápio & Produtos',
      icon: BookOpen,
      rolesPermitidas: ['administrador', 'atendente'],
    },
    {
      id: 'clientes_entregadores',
      label: 'Clientes & Entregadores',
      icon: Truck,
      rolesPermitidas: ['administrador', 'atendente', 'entregador'],
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: BarChart3,
      rolesPermitidas: ['administrador', 'caixa'],
    },
    {
      id: 'usuarios_config',
      label: 'Usuários & Config.',
      icon: Settings,
      rolesPermitidas: ['administrador'],
    },
  ];

  const itensVisiveis = menuItems.filter((item) =>
    item.rolesPermitidas.includes(roleSimulada)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 w-64 shrink-0 border-r border-slate-800 select-none">
      {/* Perfil do Operador e Simulador de Perfil RBAC */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <div className="text-sm font-semibold text-white truncate">
              {usuarioAtual.nome}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {usuarioAtual.email}
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] text-slate-400">
            Visão de Perfil Ativo (RBAC):
          </label>
          <select
            value={roleSimulada}
            onChange={(e) => onChangeRoleSimulada(e.target.value as UserRole)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="administrador">Administrador (Acesso Total)</option>
            <option value="caixa">Caixa (Vendas e Fechamento)</option>
            <option value="atendente">Atendente / Garçom (Mesas/Pedidos)</option>
            <option value="cozinha">Cozinha (Somente KDS)</option>
            <option value="entregador">Entregador (Minhas Entregas)</option>
          </select>
        </div>
      </div>

      {/* Menu de Navegação */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
        {itensVisiveis.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.contador !== undefined && item.contador > 0 && (
                <span className="text-xs font-mono tabular-nums font-semibold px-1.5 py-0.5 rounded bg-slate-950/40 text-amber-300">
                  {item.contador}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Rodapé do Menu */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="truncate">{formatRoleName(roleSimulada)}</span>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Botão Mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-30 p-3.5 bg-slate-900 text-white rounded-full shadow-lg border border-slate-700"
        aria-label="Abrir Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:block h-[calc(100vh-57px)] sticky top-[57px]">
        {sidebarContent}
      </aside>

      {/* Drawer Mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
