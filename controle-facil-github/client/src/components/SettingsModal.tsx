import React, { useState } from 'react';
import { Download, FileSpreadsheet, FolderOpen, Settings, Upload, X, Trash2, Eye, EyeOff, KeyRound } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../lib/stockData';
import { Supplier } from './Suppliers';
import { downloadImportTemplate } from '../lib/exportExcel';
import { BRAND_STORAGE_KEYS, FABY_FESTAS_DEFAULTS } from '../lib/brandDefaults';
import { useCloud } from '../contexts/CloudContext';

interface SettingsModalProps {
  isOpen: boolean;
  storeName: string;
  welcomeMessage: string;
  logoDataUrl: string;
  fontScale: number;
  canManageBrand: boolean;
  onSave: (storeName: string, welcomeMessage: string, logoDataUrl: string, fontScale: number) => void;
  onImportProducts: (products: Omit<Product, 'id'>[]) => void;
  onImportSuppliers: (suppliers: Supplier[]) => void;
  onClearDemoData: () => void;
  onClose: () => void;
}

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const numberValue = (value: unknown, fallback = 0) => { const parsed = Number(String(value ?? '').replace(',', '.')); return Number.isFinite(parsed) ? parsed : fallback; };

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, storeName, welcomeMessage, logoDataUrl, fontScale, canManageBrand, onSave, onImportProducts, onImportSuppliers, onClearDemoData, onClose }) => {
  const { profile, localMode, changePassword } = useCloud();
  const [name, setName] = useState(storeName);
  const [message, setMessage] = useState(welcomeMessage);
  const [logo, setLogo] = useState(logoDataUrl);
  const [scale, setScale] = useState(fontScale);
  const [currentPassword, setCurrentPassword] = useState(''); const [nextPassword, setNextPassword] = useState(''); const [showPasswords, setShowPasswords] = useState(false); const [passwordMessage, setPasswordMessage] = useState('');

  React.useEffect(() => { if (isOpen) { setName(storeName); setMessage(welcomeMessage); setLogo(logoDataUrl); setScale(fontScale); } }, [isOpen, storeName, welcomeMessage, logoDataUrl, fontScale]);
  if (!isOpen) return null;

  const save = (event: React.FormEvent) => { event.preventDefault(); onSave(canManageBrand ? name.trim() || 'Minha Loja' : storeName, canManageBrand ? message.trim() || 'Um passo de cada vez, com carinho pela sua loja' : welcomeMessage, canManageBrand ? logo : logoDataUrl, scale); onClose(); };

  const backupData = () => {
    const data: Record<string, unknown> = {};
    if (!localStorage.getItem(BRAND_STORAGE_KEYS.storeName)) localStorage.setItem(BRAND_STORAGE_KEYS.storeName, FABY_FESTAS_DEFAULTS.storeName);
    if (!localStorage.getItem(BRAND_STORAGE_KEYS.welcomeMessage)) localStorage.setItem(BRAND_STORAGE_KEYS.welcomeMessage, FABY_FESTAS_DEFAULTS.welcomeMessage);
    if (!localStorage.getItem(BRAND_STORAGE_KEYS.logo)) localStorage.setItem(BRAND_STORAGE_KEYS.logo, FABY_FESTAS_DEFAULTS.logoDataUrl);
    if (!localStorage.getItem(BRAND_STORAGE_KEYS.colors)) localStorage.setItem(BRAND_STORAGE_KEYS.colors, JSON.stringify(FABY_FESTAS_DEFAULTS.colors));
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || (!key.startsWith('facil_estoque_') && !key.startsWith('faby_') && !key.startsWith('brand_'))) continue;
      const rawValue = localStorage.getItem(key);
      try { data[key] = JSON.parse(rawValue || 'null'); } catch { data[key] = rawValue || ''; }
    }
    const blob = new Blob([JSON.stringify({ app: 'Controle Fácil', version: 2, exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `backup-controle-facil-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); localStorage.setItem('faby_last_backup_at', String(Date.now()));
  };

  const restoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)); const data = parsed.data || parsed; Object.entries(data).forEach(([key, value]) => { if (!key || (!key.startsWith('facil_estoque_') && !key.startsWith('faby_') && !key.startsWith('brand_'))) return; localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); }); alert('Backup restaurado. O sistema será recarregado.'); window.location.reload(); } catch { alert('Não foi possível ler este backup.'); } }; reader.readAsText(file); event.target.value = '';
  };

  const savePassword = async (event: React.FormEvent) => { event.preventDefault(); setPasswordMessage(''); if (nextPassword.length < 6) { setPasswordMessage('A nova senha precisa ter pelo menos 6 caracteres.'); return; } const result = await changePassword(currentPassword, nextPassword); setPasswordMessage(result.error || 'Senha alterada com sucesso.'); if (!result.error) { setCurrentPassword(''); setNextPassword(''); } };

  const importSpreadsheet = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'array' });
        const allRows = workbook.SheetNames.flatMap((sheetName) => XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' }));
        const productRows: Omit<Product, 'id'>[] = []; const supplierRows: Supplier[] = [];
        allRows.forEach((row, index) => {
          const keys = Object.keys(row); const get = (...names: string[]) => { const key = keys.find((candidate) => names.includes(normalize(candidate))); return key ? row[key] : ''; };
          const type = normalize(get('tipo', 'type'));
          const productName = get('produto', 'nome do produto', 'product', 'name'); const supplierName = get('fornecedor', 'nome do fornecedor', 'supplier'); const phone = get('telefone', 'phone', 'whatsapp');
          const looksLikeSupplier = type === 'fornecedor' || (!get('categoria', 'category') && !get('preco de venda', 'preco', 'price') && Boolean(supplierName || phone));
          if (looksLikeSupplier && (supplierName || productName)) supplierRows.push({ id: `supplier-import-${Date.now()}-${index}`, name: String(supplierName || productName).trim(), phone: String(phone).trim() });
          else if (productName && !normalize(productName).startsWith('exemplo') && !normalize(productName).startsWith('preencha')) productRows.push({ name: String(productName).trim(), category: String(get('categoria', 'category') || 'Outros').trim(), unit: String(get('unidade', 'unit') || 'un').trim(), price: numberValue(get('preco de venda', 'preco', 'price')), costPrice: numberValue(get('preco de custo', 'custo', 'costprice')), currentStock: numberValue(get('estoque atual', 'estoque', 'currentstock')), minStock: numberValue(get('estoque minimo', 'minimo', 'minstock')), lastMovementDate: String(get('ultima movimentacao', 'lastmovementdate') || new Date().toISOString().slice(0, 10)), barcode: String(get('codigo de barras', 'barcode') || '').trim(), supplierName: String(supplierName || '').trim() || undefined });
        });
        if (supplierRows.length) onImportSuppliers(supplierRows); if (productRows.length) onImportProducts(productRows);
        alert(`Importação concluída: ${productRows.length} produto(s) e ${supplierRows.length} fornecedor(es).`);
      } catch { alert('Não foi possível ler a planilha. Use .xlsx, .xls ou .csv.'); }
    }; reader.readAsArrayBuffer(file); event.target.value = '';
  };

  return <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain"><form onSubmit={save} className="bg-white rounded-3xl max-w-2xl w-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-8 shadow-2xl border-4 border-emerald-100 my-0 sm:my-4"><div className="flex items-center justify-between border-b-2 border-slate-100 pb-4 mb-5 sticky top-0 bg-white z-10"><div className="flex items-center gap-3"><div className="brand-mark w-11 h-11 rounded-2xl flex items-center justify-center"><Settings className="w-6 h-6 text-emerald-800" /></div><div><h2 className="text-2xl font-black text-slate-900">Jeito da sua loja</h2><p className="text-sm font-semibold text-slate-500">Personalização, segurança e importação.</p></div></div><button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500" aria-label="Fechar configurações"><X className="w-7 h-7" /></button></div>
    <div className="space-y-4">{!canManageBrand && <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-950">A identidade visual pertence à dona da loja. Você pode ajustar sua fonte e senha, mas não pode alterar nome, lema ou logo.</div>}{!canManageBrand && <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-950">A identidade visual pertence à dona da loja. Você pode ajustar sua fonte e senha, mas não pode alterar nome, lema ou logo.</div>}<div><label className="block text-sm font-black text-slate-700 uppercase mb-1">Nome da loja</label><input disabled={!canManageBrand} value={name} onChange={(event) => setName(event.target.value)} className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-lg font-bold" /></div><div><label className="block text-sm font-black text-slate-700 uppercase mb-1">Mensagem de boas-vindas</label><textarea disabled={!canManageBrand} value={message} onChange={(event) => setMessage(event.target.value)} rows={2} className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-lg font-bold resize-none" /></div><div className="rounded-2xl border-2 border-blue-100 bg-blue-50 p-4"><div className="flex items-center justify-between gap-3"><label htmlFor="font-scale" className="text-sm font-black text-blue-950 uppercase">Tamanho da fonte</label><span className="rounded-lg bg-white px-3 py-1 text-blue-800 font-black">{Math.round(scale * 100)}%</span></div><input id="font-scale" type="range" min="0.85" max="1.15" step="0.05" value={scale} onChange={(event) => setScale(Number(event.target.value))} className="w-full mt-3 accent-blue-700" /><div className="flex justify-between text-xs font-bold text-blue-800"><span>Menor</span><span>Padrão</span><span>Maior</span></div><p className="text-xs font-semibold text-blue-900 mt-2">Ajuste para ficar confortável no seu computador. A escolha fica salva automaticamente.</p></div><div><label className="block text-sm font-black text-slate-700 uppercase mb-1">Logo ou foto da loja</label><input disabled={!canManageBrand} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setLogo(String(reader.result)); reader.readAsDataURL(file); }} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold" />{logo && <div className="flex items-center gap-3 mt-2"><img src={logo} alt="Prévia da logo" className="w-12 h-12 rounded-xl object-cover" /><button disabled={!canManageBrand} type="button" onClick={() => setLogo('')} className="text-sm font-black text-rose-700">Remover foto</button></div>}</div></div>
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3"><button type="button" onClick={backupData} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border-2 border-blue-200 text-blue-800 font-black"><Download className="w-5 h-5" />Fazer backup</button><label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-900 font-black cursor-pointer"><FolderOpen className="w-5 h-5" />Restaurar backup<input type="file" accept="application/json,.json" onChange={restoreBackup} className="hidden" /></label></div>
    <div className="mt-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-emerald-700" /><h3 className="font-black text-emerald-950">Importar planilha Excel</h3></div><p className="text-sm font-semibold text-emerald-900 mt-1">Use o modelo com as abas Produtos e Fornecedores. O nome digitado na coluna Fornecedor vincula o produto ao contato cadastrado.</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3"><button type="button" onClick={downloadImportTemplate} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-emerald-300 text-emerald-800 font-black"><Download className="w-5 h-5" />Baixar modelo padrão</button><label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black cursor-pointer"><Upload className="w-5 h-5" />Importar preenchida<input type="file" accept=".xlsx,.xls,.csv" onChange={importSpreadsheet} className="hidden" /></label></div></div>
    <div className="mt-5 rounded-2xl border-2 border-blue-100 bg-blue-50 p-4"><div className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-blue-700" /><h3 className="font-black text-blue-950">Alterar minha senha</h3></div><p className="text-sm font-semibold text-blue-900 mt-1">{profile ? `Conta: ${profile.email}` : 'Entre na sua conta para alterar a senha.'}</p>{profile && <form onSubmit={savePassword} className="mt-3 space-y-2"><div className="relative"><input required={localMode} type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={localMode ? 'Senha atual' : 'Senha atual (não exigida pelo provedor)'} className="w-full px-3 py-2.5 pr-11 rounded-xl border-2 border-blue-200 font-bold" /><button type="button" onClick={() => setShowPasswords((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-700" aria-label="Mostrar ou ocultar senhas">{showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div><input required minLength={6} type={showPasswords ? 'text' : 'password'} value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} placeholder="Nova senha (mínimo 6 caracteres)" className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 font-bold" /><button type="submit" className="px-4 py-2.5 rounded-xl bg-blue-700 text-white font-black">Salvar nova senha</button>{passwordMessage && <p className="text-sm font-bold text-blue-900">{passwordMessage}</p>}</form>}</div>
    <div className="mt-5 rounded-2xl border-2 border-rose-100 bg-rose-50 p-4"><div className="flex items-start gap-3"><Trash2 className="w-5 h-5 text-rose-700 mt-0.5" /><div><h3 className="font-black text-rose-950">Começar do zero</h3><p className="text-sm font-semibold text-rose-900 mt-1">Remove arroz, feijão, vendas e demais dados de demonstração. Sua logo, nome, lema e tamanho da fonte permanecem.</p><button type="button" onClick={() => { if (window.confirm('Remover todos os dados de exemplo e começar do zero?')) { onClearDemoData(); onClose(); } }} className="mt-3 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black">Limpar dados de exemplo</button></div></div></div><div className="flex justify-end gap-2 mt-6"><button type="button" onClick={onClose} className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">Fechar</button><button disabled={!canManageBrand} type="submit" className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-black">Salvar personalização</button></div>
  </form></div>;
};
