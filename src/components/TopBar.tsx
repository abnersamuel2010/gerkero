import React from 'react';
import { Share2 } from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface TopBarProps {
  nomeRestaurante: string;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenBancoModal: () => void;
  onOpenLinkClienteModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  nomeRestaurante,
  activeTab,
  onSelectTab,
  onOpenBancoModal,
  onOpenLinkClienteModal,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-20">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#dashboard"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('dashboard');
        }}
        className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap truncate max-w-[260px]"
      >
        {nomeRestaurante || 'Sabor & Brasa'}
      </a>

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
          className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap shrink-0"
        >
          App Delivery Cliente
        </button>
      </div>
    </header>
  );
};
