import React from 'react';
import {
  Share2,
  Flame,
  UtensilsCrossed,
  Beef,
  Crown,
  Zap,
  Soup,
  ChefHat,
  Sparkles,
} from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface TopBarProps {
  nomeRestaurante: string;
  corPrimaria?: string;
  iconeTema?: string;
  logoUrl?: string;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenBancoModal: () => void;
  onOpenLinkClienteModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  nomeRestaurante,
  corPrimaria = '#e11d48',
  iconeTema = 'flame',
  logoUrl,
  activeTab,
  onSelectTab,
  onOpenBancoModal,
  onOpenLinkClienteModal,
}) => {
  const renderIcone = () => {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={nomeRestaurante}
          className="w-full h-full object-cover rounded-xl"
        />
      );
    }
    const props = { className: 'w-5 h-5 text-white' };
    switch (iconeTema) {
      case 'beef':
        return <Beef {...props} />;
      case 'utensils':
        return <UtensilsCrossed {...props} />;
      case 'crown':
        return <Crown {...props} />;
      case 'zap':
        return <Zap {...props} />;
      case 'soup':
        return <Soup {...props} />;
      case 'chef-hat':
        return <ChefHat {...props} />;
      case 'sparkles':
        return <Sparkles {...props} />;
      default:
        return <Flame {...props} />;
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      {/* Zone 1: Restaurant icon and brand name */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors"
          style={{ backgroundColor: corPrimaria }}
        >
          {renderIcone()}
        </div>
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap truncate max-w-[260px]"
        >
          {nomeRestaurante || 'RESTAURANTE KERO'}
        </a>
      </div>

      {/* Zone 2: 5 clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard' ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-600' : ''
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => onSelectTab('marmitas')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'marmitas' ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-600' : ''
          }`}
        >
          Marmitas
        </button>
        <button
          onClick={() => onSelectTab('delivery_painel')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'delivery_painel' ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-600' : ''
          }`}
        >
          Kanban Delivery
        </button>
        <button
          onClick={() => onSelectTab('mesas')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'mesas' ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-600' : ''
          }`}
        >
          Mapa de Mesas
        </button>
        <button
          onClick={() => onSelectTab('cozinha')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'cozinha' ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-600' : ''
          }`}
        >
          Cozinha KDS
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2.5">
        {onOpenLinkClienteModal && (
          <button
            type="button"
            onClick={onOpenLinkClienteModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            title="Copiar e compartilhar link de pedidos com clientes"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-600" />
            Link do Cliente
          </button>
        )}
        <button
          onClick={onOpenBancoModal}
          className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Iniciar Banco Real
        </button>
        <button
          onClick={() => onSelectTab('delivery_cliente')}
          style={{ backgroundColor: corPrimaria }}
          className="px-4 py-2 text-xs font-semibold text-white rounded-lg opacity-95 hover:opacity-100 transition-opacity whitespace-nowrap shrink-0 shadow-xs"
        >
          App Delivery Cliente
        </button>
      </div>
    </header>
  );
};
