import React, { useState } from 'react';
import { ShoppingCart, AlertTriangle, PackageX, ListPlus, History, HelpCircle, Settings, Truck, Smartphone, BarChart3, Users, Wallet, KeyRound, X } from 'lucide-react';
import { useStock } from '../contexts/StockContext';
import { useCloud } from '../contexts/CloudContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  storeName: string;
  welcomeMessage: string;
  greeting: string;
  logoDataUrl: string;
  onInstall: () => void;
  canInstall: boolean;
  onOpenAuth: () => void;
  cloudLabel: string;
  isOwner: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenHelp, onOpenSettings, storeName, welcomeMessage, greeting, logoDataUrl, onInstall, canInstall, onOpenAuth, cloudLabel, isOwner }) => {
  const { criticalProducts, stagnantProducts } = useStock();
  const { cashiers, activeCashier, switchCashier, clearCashier } = useCloud();
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [cashierPin, setCashierPin] = useState('');
  const [cashierMessage, setCashierMessage] = useState('');
  const chooseCashier = (event: React.FormEvent) => { event.preventDefault(); const result = switchCashier(cashierPin); setCashierMessage(result.error || 'Operador selecionado.'); if (!result.error) { setCashierPin(''); window.setTimeout(() => setIsCashierOpen(false), 450); } };

  const tabs = [
    {
      id: 'quick-ops',
      label: 'Vendas e Entradas',
      sublabel: 'Lançar movimentação',
      icon: ShoppingCart,
      iconTone: 'text-emerald-700',
      badge: null
    },
    {
      id: 'critical-stock',
      label: 'Falta Repor',
      sublabel: 'Lista de compras',
      icon: AlertTriangle,
      iconTone: 'text-rose-700',
      badge: criticalProducts.length > 0 ? criticalProducts.length : null,
      badgeClass: 'bg-rose-100 text-rose-800'
    },
    {
      id: 'stagnant-stock',
      label: 'Produtos Parados',
      sublabel: 'Sugestões de promoção',
      icon: PackageX,
      iconTone: 'text-amber-700',
      badge: stagnantProducts.length > 0 ? stagnantProducts.length : null,
      badgeClass: 'bg-amber-100 text-amber-900'
    },
    {
      id: 'manage-products',
      label: 'Todos os Produtos',
      sublabel: 'Cadastro por categoria',
      icon: ListPlus,
      iconTone: 'text-blue-700',
      badge: null
    },
    {
      id: 'history',
      label: 'Histórico do Dia',
      sublabel: 'Vendas e entradas',
      icon: History,
      iconTone: 'text-slate-700',
      badge: null
    },
    {
      id: 'suppliers',
      label: 'Financeiro',
      sublabel: 'Fornecedores e despesas',
      icon: Wallet,
      iconTone: 'text-yellow-700',
      badge: null
    },
    {
      id: 'dashboard', label: 'Painel da Loja', sublabel: 'Gráficos e resumo', icon: BarChart3, iconTone: 'text-indigo-700', badge: null
    },
    {
      id: 'admin', label: 'Equipe', sublabel: 'Acessos da loja', icon: Users, iconTone: 'text-blue-700', badge: null
    }
  ];

  return (
    <header className="bg-white border-b border-slate-200 relative z-10 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="brand-mark w-12 h-12 rounded-2xl border border-emerald-200 text-emerald-800 flex items-center justify-center font-black text-2xl">
              {logoDataUrl ? <img src={logoDataUrl} alt={`Logo de ${storeName}`} className="w-full h-full rounded-2xl object-cover" /> : <span aria-hidden="true">📦</span>}
            </div>
            <div>
              <div className="brand-kicker">Feito para cuidar do seu negócio</div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {storeName}
              </h1>
              <p className="brand-greeting mt-0.5">{greeting}, {storeName}!</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{welcomeMessage}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button onClick={onOpenAuth} type="button" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-base border border-slate-200" title="Acesso online"><span className={`w-2 h-2 rounded-full ${cloudLabel === 'Online' ? 'bg-green-500' : 'bg-slate-400'}`} /><span className="hidden sm:inline">{cloudLabel}</span></button>
            {cloudLabel.includes('Dona') || cloudLabel.includes('Funcionário') ? <span className={`px-3 py-2.5 rounded-xl font-black text-sm border ${isOwner ? 'bg-pink-50 text-pink-800 border-pink-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>{isOwner ? 'Permissão: dona' : 'Permissão: funcionário'}</span> : null}
            {cashiers.length > 0 && <button onClick={() => { setCashierMessage(''); setIsCashierOpen(true); }} type="button" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-base border border-emerald-200" title="Trocar operador do computador"><KeyRound className="w-5 h-5" /><span className="hidden sm:inline">{activeCashier ? activeCashier.name : 'Operador'}</span></button>}
            <button onClick={onInstall} type="button" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-base border border-blue-200" title="Instalar no celular"><Smartphone className="w-5 h-5" /><span className="hidden sm:inline">{canInstall ? 'Instalar' : 'Usar como app'}</span></button>
            <button onClick={onOpenSettings} type="button" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-800 font-bold text-base border border-pink-200" title="Personalizar loja"><Settings className="w-5 h-5" /><span className="hidden sm:inline">Personalizar</span></button>
            <button onClick={onOpenHelp} type="button" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-base border border-slate-200"><HelpCircle className="w-5 h-5 text-slate-500" /><span>Como usar</span></button>
          </div>
      </div>
      {isCashierOpen && <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-4 border-emerald-200"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black uppercase tracking-wider text-emerald-700">Caixa compartilhado</p><h2 className="text-2xl font-black text-slate-900 mt-1">Trocar operador</h2></div><button type="button" onClick={() => setIsCashierOpen(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-6 h-6" /></button></div><p className="mt-3 text-sm font-semibold text-slate-600">Digite o PIN de 4 números do funcionário. As próximas vendas ficarão registradas com o nome escolhido.</p><form onSubmit={chooseCashier} className="mt-5 space-y-3"><input autoFocus required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={cashierPin} onChange={(event) => setCashierPin(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="PIN de 4 números" className="w-full px-4 py-4 rounded-xl border-2 border-slate-300 text-2xl tracking-[0.4em] text-center font-black" /><button className="w-full px-4 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-lg">Confirmar operador</button></form>{activeCashier && <button type="button" onClick={() => { clearCashier(); setIsCashierOpen(false); }} className="w-full mt-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">Usar usuário principal</button>}{cashierMessage && <p className="mt-3 text-sm font-black text-rose-700">{cashierMessage}</p>}<p className="mt-4 text-xs font-bold text-amber-800">Para trocar configurações ou acessar a equipe, use o login da dona. O PIN é para agilizar o caixa da loja.</p></div></div>}

      <nav className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 pt-3" aria-label="Menu principal">
          {tabs.filter((tab) => isOwner || tab.id !== 'admin').map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`relative flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-[#172554] to-[#1e3a8a] border-[#172554] text-white shadow-[0_8px_20px_rgba(30,58,138,0.18)] ring-2 ring-pink-100'
                    : 'bg-white/75 border-slate-200 text-slate-700 hover:bg-white hover:border-pink-200 hover:shadow-[0_6px_16px_rgba(219,39,119,0.08)]'
                }`}
              >
                {tab.badge && (
                  <span className={`absolute -top-2 -right-1 min-w-7 text-center text-sm px-2 py-0.5 rounded-full border border-white shadow-sm font-black ${tab.badgeClass}`}>
                    {tab.badge}
                  </span>
                )}
                <Icon className={`w-7 h-7 mb-1.5 ${isActive ? 'text-yellow-300' : tab.iconTone}`} />
                <span className="text-base sm:text-lg font-bold leading-tight">{tab.label}</span>
                <span className={`text-xs mt-1 line-clamp-1 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  {tab.sublabel}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
