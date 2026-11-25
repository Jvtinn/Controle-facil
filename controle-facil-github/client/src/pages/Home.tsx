import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { QuickOperations } from '../components/QuickOperations';
import { CriticalStockList } from '../components/CriticalStockList';
import { StagnantProductsList } from '../components/StagnantProductsList';
import { ManageProducts } from '../components/ManageProducts';
import { MovementHistory } from '../components/MovementHistory';
import { HelpModal } from '../components/HelpModal';
import { SettingsModal } from '../components/SettingsModal';
import { STORAGE_KEY as SUPPLIERS_STORAGE_KEY, Supplier } from '../components/Suppliers';
import { Dashboard } from '../components/Dashboard';
import { AdminPanel } from '../components/AdminPanel';
import { FinancePanel } from '../components/FinancePanel';
import { Product } from '../lib/stockData';
import { useStock } from '../contexts/StockContext';
import { CheckCircle2, ClipboardList, Sparkles, ArrowRight, PackagePlus, Truck, ShoppingCart, Bell } from 'lucide-react';
import { BRAND_STORAGE_KEYS, FABY_FESTAS_DEFAULTS, getStoredBrandColors } from '../lib/brandDefaults';
import { useCloud } from '../contexts/CloudContext';
import { AuthModal } from '../components/AuthModal';
import { InstallGuideModal } from '../components/InstallGuideModal';
import { supabase } from '../lib/supabase';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>('quick-ops');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [backupReminder, setBackupReminder] = useState(false);
  const [storeName, setStoreName] = useState(() => localStorage.getItem(BRAND_STORAGE_KEYS.storeName) || FABY_FESTAS_DEFAULTS.storeName);
  const [welcomeMessage, setWelcomeMessage] = useState(() => localStorage.getItem(BRAND_STORAGE_KEYS.welcomeMessage) || FABY_FESTAS_DEFAULTS.welcomeMessage);
  const [logoDataUrl, setLogoDataUrl] = useState(() => localStorage.getItem(BRAND_STORAGE_KEYS.logo) || FABY_FESTAS_DEFAULTS.logoDataUrl);
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem(BRAND_STORAGE_KEYS.fontScale) || String(FABY_FESTAS_DEFAULTS.fontScale)));
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { products, criticalProducts, stagnantProducts, addProduct, clearDemoData, realtimeSaleAlert, dismissRealtimeSaleAlert } = useStock();
  const { configured: cloudConfigured, user, profile, isAuthenticated, localMode, signOut } = useCloud();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  React.useEffect(() => {
    document.documentElement.style.setProperty('--user-font-scale', String(fontScale));
    const colors = getStoredBrandColors();
    document.documentElement.style.setProperty('--brand-pink', colors.pink);
    document.documentElement.style.setProperty('--brand-yellow', colors.yellow);
    document.documentElement.style.setProperty('--brand-blue', colors.blue);
  }, [fontScale]);
  React.useEffect(() => {
    if (localMode && profile?.company_name && !localStorage.getItem(BRAND_STORAGE_KEYS.storeName)) {
      setStoreName(profile.company_name);
      localStorage.setItem(BRAND_STORAGE_KEYS.storeName, profile.company_name);
    }
  }, [localMode, profile?.company_name]);

  React.useEffect(() => {
    if (!supabase || !profile?.store_id) return;
    let active = true;
    void supabase.from('stores').select('name, welcome_message, logo_data_url, brand_colors').eq('id', profile.store_id).maybeSingle().then(({ data }) => {
      if (!active || !data) return;
      const colors = data.brand_colors && typeof data.brand_colors === 'object' ? data.brand_colors as Record<string, string> : getStoredBrandColors();
      setStoreName(data.name || 'Controle Fácil');
      setWelcomeMessage(data.welcome_message || 'Organize sua loja com simplicidade');
      setLogoDataUrl(data.logo_data_url || '');
      localStorage.setItem(BRAND_STORAGE_KEYS.storeName, data.name || 'Controle Fácil');
      localStorage.setItem(BRAND_STORAGE_KEYS.welcomeMessage, data.welcome_message || 'Organize sua loja com simplicidade');
      localStorage.setItem(BRAND_STORAGE_KEYS.logo, data.logo_data_url || '');
      localStorage.setItem(BRAND_STORAGE_KEYS.colors, JSON.stringify(colors));
      document.documentElement.style.setProperty('--brand-pink', colors.pink || '#db2777');
      document.documentElement.style.setProperty('--brand-yellow', colors.yellow || '#facc15');
      document.documentElement.style.setProperty('--brand-blue', colors.blue || '#1d4ed8');
    });
    return () => { active = false; };
  }, [profile?.store_id]);

  React.useEffect(() => {
    const lastBackup = Number(localStorage.getItem('faby_last_backup_at') || 0);
    setBackupReminder(!lastBackup || Date.now() - lastBackup >= 7 * 24 * 60 * 60 * 1000);
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated || new URLSearchParams(window.location.search).get('recovery') !== '1') return;
    setIsSettingsOpen(true);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [isAuthenticated]);

  React.useEffect(() => {
    const captureInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', captureInstall);
    return () => window.removeEventListener('beforeinstallprompt', captureInstall);
  }, []);

  const installApp = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
      return;
    }
    setIsInstallGuideOpen(true);
  };

  const hasPendingItems = criticalProducts.length > 0 || stagnantProducts.length > 0;
  const changeTab = (tab: string) => {
    setCurrentTab(tab);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  return (
    <div className="min-h-screen bg-[#fffafc] flex flex-col font-sans selection:bg-pink-100">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={changeTab}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        storeName={storeName}
        welcomeMessage={welcomeMessage}
        greeting={greeting}
        logoDataUrl={logoDataUrl}
        onInstall={installApp}
        canInstall={Boolean(installPrompt)}
        onOpenAuth={() => { if (isAuthenticated) { void signOut(); } else setIsAuthOpen(true); }}
        cloudLabel={isAuthenticated ? (localMode ? (profile?.role === 'owner' ? `Dona local${profile.full_name ? `: ${profile.full_name}` : ''}` : `Funcionário local${profile?.full_name ? `: ${profile.full_name}` : ''}`) : (profile?.role === 'owner' ? `Dona online${profile.full_name ? `: ${profile.full_name}` : ''}` : `Funcionário online${profile?.full_name ? `: ${profile.full_name}` : ''}`)) : cloudConfigured ? 'Entrar online' : 'Entrar / criar conta'}
        isOwner={profile?.role === 'owner'}
      />

      {!isAuthenticated && <section className="max-w-7xl mx-auto w-full px-4 pt-4"><div className="rounded-2xl border-2 border-blue-100 bg-blue-50 px-4 py-4"><p className="font-black text-blue-950">Bem-vinda ao Controle Fácil</p><p className="mt-1 text-sm font-semibold text-blue-900">Para começar, a dona deve criar a conta, informar o nome da empresa e depois cadastrar os primeiros produtos. Funcionários entram com o acesso criado pela dona.</p><button type="button" onClick={() => setIsAuthOpen(true)} className="mt-3 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black">Criar conta da empresa</button></div></section>}
      {backupReminder && isAuthenticated && <section className="max-w-7xl mx-auto w-full px-4 pt-4"><div className="rounded-2xl border-2 border-yellow-200 bg-yellow-50 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"><div><p className="font-black text-yellow-950">Lembrete semanal de segurança</p><p className="text-sm font-semibold text-yellow-900">Exporte um backup para não perder vendas, estoque e configurações.</p></div><div className="flex gap-2"><button type="button" onClick={() => setIsSettingsOpen(true)} className="px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black">Fazer backup agora</button><button type="button" onClick={() => setBackupReminder(false)} className="px-3 py-2.5 rounded-xl bg-white text-yellow-900 font-bold">Lembrar depois</button></div></div></section>}
      {realtimeSaleAlert && profile?.role === 'owner' && <section className="max-w-7xl mx-auto w-full px-4 pt-4"><div role="status" className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 flex items-start gap-3 shadow-sm"><Bell className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" /><div className="flex-1"><p className="font-black text-emerald-950">Nova venda registrada</p><p className="text-sm font-semibold text-emerald-900">{realtimeSaleAlert.actorName} vendeu {realtimeSaleAlert.quantity} unidade(s) de {realtimeSaleAlert.productName}.</p></div><button type="button" onClick={dismissRealtimeSaleAlert} className="px-3 py-2 rounded-xl bg-white text-emerald-800 font-black">Entendi</button></div></section>}

      {/* Um único resumo curto: orienta sem tomar conta da tela. */}
      <section className="max-w-7xl mx-auto w-full px-4 pt-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.12)]" />
          <span className="brand-footer-note text-xs font-black uppercase tracking-[0.12em]">Hoje na sua loja</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {hasPendingItems ? (
              <ClipboardList className="w-6 h-6 text-slate-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            )}
            <div>
              <p className="font-black text-slate-800 text-base">
                {hasPendingItems ? 'Resumo da loja' : 'Tudo tranquilo por aqui'}
              </p>
              <p className="text-sm text-slate-500 font-medium">
                {hasPendingItems
                  ? 'Há itens que merecem sua atenção. Você pode ver quando quiser.'
                  : 'Nenhuma pendência importante encontrada agora.'}
              </p>
            </div>
          </div>

          {hasPendingItems && (
            <div className="flex flex-wrap gap-2 pl-9 sm:pl-0">
              {criticalProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentTab('critical-stock')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-sm font-black"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  {criticalProducts.length} para repor
                </button>
              )}
              {stagnantProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentTab('stagnant-stock')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-sm font-black"
                >
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  {stagnantProducts.length} parados
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {currentTab === 'quick-ops' && products.length === 0 ? (
          <section className="rounded-[2rem] border-2 border-pink-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-pink-600 via-pink-500 to-blue-600 px-6 py-10 sm:px-12 sm:py-12 text-white text-center">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-5xl" aria-hidden="true">✨</span>
              </div>
              <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-yellow-200">Tudo pronto para começar</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">Vamos organizar a sua loja?</h2>
              <p className="mt-3 max-w-2xl mx-auto text-base sm:text-lg font-semibold text-pink-50">Cadastre os produtos da {storeName} e o Controle Fácil cuidará das entradas, vendas e alertas para você.</p>
            </div>
            <div className="p-6 sm:p-10">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 text-center">É simples: faça assim</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="rounded-2xl border-2 border-pink-100 bg-pink-50 p-5"><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black text-lg">1</span><PackagePlus className="w-6 h-6 text-pink-700" /></div><h4 className="mt-4 font-black text-slate-900">Cadastre um produto</h4><p className="mt-1 text-sm font-semibold text-slate-600">Informe nome, categoria, preço e quantidade inicial.</p></div>
                  <div className="rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-5"><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black text-lg">2</span><Truck className="w-6 h-6 text-yellow-700" /></div><h4 className="mt-4 font-black text-slate-900">Organize a reposição</h4><p className="mt-1 text-sm font-semibold text-slate-600">Defina o estoque mínimo e, se quiser, vincule um fornecedor.</p></div>
                  <div className="rounded-2xl border-2 border-blue-100 bg-blue-50 p-5"><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-lg">3</span><ShoppingCart className="w-6 h-6 text-blue-700" /></div><h4 className="mt-4 font-black text-slate-900">Registre o movimento</h4><p className="mt-1 text-sm font-semibold text-slate-600">Use os botões de venda e entrada sempre que algo sair ou chegar.</p></div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"><button type="button" onClick={() => setCurrentTab('manage-products')} className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-black text-lg shadow-md"><PackagePlus className="w-6 h-6" />Cadastrar meu primeiro produto<ArrowRight className="w-5 h-5" /></button><button type="button" onClick={() => setIsHelpOpen(true)} className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">Ver como usar</button></div>
                <p className="text-center text-xs text-slate-500 font-semibold mt-5">Você poderá importar uma planilha ou cadastrar vários produtos depois.</p>
              </div>
            </div>
          </section>
        ) : currentTab === 'quick-ops' ? <QuickOperations /> : null}
        {currentTab === 'critical-stock' && <CriticalStockList />}
        {currentTab === 'stagnant-stock' && <StagnantProductsList />}
        {currentTab === 'manage-products' && <ManageProducts />}
        {currentTab === 'history' && <MovementHistory />}
        {currentTab === 'suppliers' && <FinancePanel />}
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'admin' && <AdminPanel />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-5 text-center text-slate-500 text-sm font-semibold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Controle Fácil de Estoque Comercial • feito com carinho</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="text-slate-700 underline hover:text-emerald-700 font-bold"
            >
              Manual de instruções
            </button>
            <span className="hidden sm:inline">•</span>
            <span className="text-emerald-700 font-bold">Dados salvos automaticamente</span>
          </div>
        </div>
      </footer>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <InstallGuideModal isOpen={isInstallGuideOpen} onClose={() => setIsInstallGuideOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        storeName={storeName}
        welcomeMessage={welcomeMessage}
        logoDataUrl={logoDataUrl}
        fontScale={fontScale}
        canManageBrand={profile?.role === 'owner'}
        onImportProducts={(importedProducts: Omit<Product, 'id'>[]) => {
          const importedSuppliers = JSON.parse(localStorage.getItem(SUPPLIERS_STORAGE_KEY) || '[]') as Supplier[];
          importedProducts.forEach((product) => {
            const supplier = product.supplierName ? importedSuppliers.find((item) => item.name.toLowerCase() === product.supplierName?.toLowerCase()) : undefined;
            addProduct({ ...product, supplierId: supplier?.id, supplierName: supplier?.name });
          });
        }}
        onImportSuppliers={(importedSuppliers: Supplier[]) => {
          const current = JSON.parse(localStorage.getItem(SUPPLIERS_STORAGE_KEY) || '[]') as Supplier[];
          localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify([...importedSuppliers, ...current]));
          window.dispatchEvent(new Event('facil-suppliers-updated'));
        }}
        onClearDemoData={clearDemoData}
        onSave={(name, message, logo, nextFontScale) => {
          setStoreName(name);
          setWelcomeMessage(message);
          setLogoDataUrl(logo);
          setFontScale(nextFontScale);
          localStorage.setItem(BRAND_STORAGE_KEYS.storeName, name);
          localStorage.setItem(BRAND_STORAGE_KEYS.welcomeMessage, message);
          localStorage.setItem(BRAND_STORAGE_KEYS.logo, logo || FABY_FESTAS_DEFAULTS.logoDataUrl);
          localStorage.setItem(BRAND_STORAGE_KEYS.fontScale, String(nextFontScale));
          localStorage.setItem(BRAND_STORAGE_KEYS.colors, JSON.stringify(FABY_FESTAS_DEFAULTS.colors));
          if (supabase && profile?.role === 'owner' && profile.store_id) {
            void supabase.from('stores').update({ name, welcome_message: message, logo_data_url: logo || '', brand_colors: getStoredBrandColors() }).eq('id', profile.store_id);
          }
        }}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
