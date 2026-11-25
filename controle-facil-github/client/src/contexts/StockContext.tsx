import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, StockMovement, isStockCritical, calculateDaysSince, isStagnant, PaymentMethod } from '../lib/stockData';
import { toast } from 'sonner';
import { useCloud } from './CloudContext';
import { supabase } from '../lib/supabase';

export interface SupplierContact { id: string; date: string; channel: 'whatsapp'; itemNames: string[]; }
export interface ExtraExpense { id: string; date: string; description: string; amount: number; }
interface StockContextType { products: Product[]; movements: StockMovement[]; supplierContacts: SupplierContact[]; extraExpenses: ExtraExpense[]; realtimeSaleAlert: { productName: string; quantity: number; actorName: string; at: string } | null; dismissRealtimeSaleAlert: () => void; updateQuantity: (productId: string, delta: number, reason?: 'sale' | 'restock', paymentMethod?: PaymentMethod) => void; addProduct: (product: Omit<Product, 'id'>) => void; updateProduct: (product: Product) => void; deleteProduct: (id: string) => void; recordSupplierContact: (itemNames: string[]) => void; recordExtraExpense: (description: string, amount: number) => void; updateExtraExpense: (expense: ExtraExpense) => void; deleteExtraExpense: (id: string) => void; clearDemoData: () => void; resetToDefault: () => void; simulateProductOldSale: (productId: string, daysAgo: number) => void; criticalProducts: Product[]; stagnantProducts: { product: Product; days: number }[]; totalItems: number; }
const StockContext = createContext<StockContextType | undefined>(undefined);
const STORAGE_KEY_PRODUCTS = 'facil_estoque_products_v1'; const STORAGE_KEY_MOVEMENTS = 'facil_estoque_movements_v1'; const STORAGE_KEY_SUPPLIER_CONTACTS = 'facil_estoque_supplier_contacts_v1'; const STORAGE_KEY_EXTRA_EXPENSES = 'facil_estoque_extra_expenses_v1';

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user, activeCashier } = useCloud();
  const [products, setProducts] = useState<Product[]>(() => { const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS); if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } } return []; });
  const [movements, setMovements] = useState<StockMovement[]>(() => { const saved = localStorage.getItem(STORAGE_KEY_MOVEMENTS); if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } } return []; });
  const [supplierContacts, setSupplierContacts] = useState<SupplierContact[]>(() => { const saved = localStorage.getItem(STORAGE_KEY_SUPPLIER_CONTACTS); if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } } return []; });
  const [extraExpenses, setExtraExpenses] = useState<ExtraExpense[]>(() => { const saved = localStorage.getItem(STORAGE_KEY_EXTRA_EXPENSES); if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } } return []; });
  const cloudHydrated = useRef(false);
  const [realtimeSaleAlert, setRealtimeSaleAlert] = useState<StockContextType['realtimeSaleAlert']>(null);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products)); }, [products]); useEffect(() => { localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(movements)); }, [movements]); useEffect(() => { localStorage.setItem(STORAGE_KEY_SUPPLIER_CONTACTS, JSON.stringify(supplierContacts)); }, [supplierContacts]); useEffect(() => { localStorage.setItem(STORAGE_KEY_EXTRA_EXPENSES, JSON.stringify(extraExpenses)); }, [extraExpenses]);

  const reloadCloud = async (storeId: string) => {
    if (!supabase) return;
    const [{ data: remoteProducts }, { data: remoteMovements }, { data: remoteExpenses }] = await Promise.all([
      supabase.from('products').select('*').eq('store_id', storeId).order('name'),
      supabase.from('stock_movements').select('*').eq('store_id', storeId).order('date', { ascending: false }).limit(200),
      supabase.from('extra_expenses').select('*').eq('store_id', storeId).order('date', { ascending: false }).limit(200),
    ]);
    if (remoteProducts && remoteProducts.length) setProducts(remoteProducts.map((p) => ({ id: p.id, name: p.name, category: p.category, unit: p.unit, price: Number(p.price), costPrice: Number(p.cost_price || 0), currentStock: Number(p.current_stock), minStock: Number(p.min_stock), lastMovementDate: p.last_movement_date, barcode: p.barcode || undefined, supplierId: p.supplier_id || undefined, supplierName: p.supplier_name || undefined })));
    if (remoteMovements && remoteMovements.length) setMovements(remoteMovements.map((m) => ({ id: m.id, productId: m.product_id, productName: m.product_name, type: m.type, quantity: Number(m.quantity), previousStock: Number(m.previous_stock), newStock: Number(m.new_stock), date: m.date, unitValue: Number(m.unit_value), totalValue: Number(m.total_value), paymentMethod: m.payment_method || undefined, note: m.note || undefined, actorId: m.actor_id || undefined, actorName: m.actor_name || undefined })));
    if (remoteExpenses) setExtraExpenses(remoteExpenses.map((e) => ({ id: e.id, date: e.date, description: e.description, amount: Number(e.amount) })));
    cloudHydrated.current = true;
  };
  useEffect(() => {
    if (!profile?.store_id || !supabase) return;
    const client = supabase;
    reloadCloud(profile.store_id).catch((error) => console.error('Falha ao carregar estoque online:', error));
    const channel = client.channel(`store-${profile.store_id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${profile.store_id}` }, () => { reloadCloud(profile.store_id).catch(console.error); }).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_movements', filter: `store_id=eq.${profile.store_id}` }, (payload) => { const row = payload.new as Record<string, unknown>; if (row.type === 'sale') setRealtimeSaleAlert({ productName: String(row.product_name || 'Produto'), quantity: Number(row.quantity || 0), actorName: String(row.actor_name || 'Funcionário'), at: String(row.date || new Date().toISOString()) }); reloadCloud(profile.store_id).catch(console.error); }).subscribe();
    return () => { void client.removeChannel(channel); };
  }, [profile?.store_id]);
  useEffect(() => {
    if (!profile?.store_id || !supabase || !cloudHydrated.current) return;
    const rows = products.map((p) => ({ id: p.id, store_id: profile.store_id, name: p.name, category: p.category, unit: p.unit, price: p.price, cost_price: p.costPrice || 0, current_stock: p.currentStock, min_stock: p.minStock, last_movement_date: p.lastMovementDate, barcode: p.barcode || null, supplier_id: p.supplierId || null, supplier_name: p.supplierName || null, updated_at: new Date().toISOString() }));
    if (rows.length) supabase.from('products').upsert(rows).then(({ error }) => { if (error) console.error('Falha ao sincronizar produtos:', error); });
  }, [products, profile?.store_id]);
  useEffect(() => {
    if (!profile?.store_id || !supabase || !cloudHydrated.current) return;
    const rows = movements.map((m) => ({ id: m.id, store_id: profile.store_id, product_id: m.productId, product_name: m.productName, type: m.type, quantity: m.quantity, previous_stock: m.previousStock, new_stock: m.newStock, date: m.date, unit_value: m.unitValue, total_value: m.totalValue, payment_method: m.paymentMethod || null, note: m.note || null, actor_id: m.actorId || user?.id || null, actor_name: m.actorName || profile.full_name || profile.email }));
    if (rows.length) supabase.from('stock_movements').upsert(rows).then(({ error }) => { if (error) console.error('Falha ao sincronizar movimentações:', error); });
  }, [movements, profile?.store_id]);

  const updateQuantity = (productId: string, delta: number, forcedType?: 'sale' | 'restock', paymentMethod?: PaymentMethod) => { setProducts((prev) => prev.map((p) => { if (p.id !== productId) return p; const newStock = Math.max(0, p.currentStock + delta); const actualDelta = newStock - p.currentStock; if (actualDelta === 0 && delta < 0) { toast.error(`"${p.name}" já está com estoque zerado!`); return p; } const type: 'sale' | 'restock' | 'adjustment' = forcedType || (delta < 0 ? 'sale' : 'restock'); const unitValue = type === 'sale' ? p.price : (p.costPrice ?? p.price * 0.7); const newMovement: StockMovement = { id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, productId: p.id, productName: p.name, type, quantity: Math.abs(actualDelta), previousStock: p.currentStock, newStock, date: new Date().toISOString(), unitValue, totalValue: Math.abs(actualDelta) * unitValue, paymentMethod: type === 'sale' ? paymentMethod : undefined, note: type === 'sale' ? 'Venda registrada' : 'Compra/entrada de fornecedor', actorId: user?.id, actorName: activeCashier?.name || profile?.full_name || profile?.email || 'Usuário local' }; setMovements((prevMov) => [newMovement, ...prevMov.slice(0, 99)]); if (type === 'sale') toast.success(`Baixa registrada: ${Math.abs(actualDelta)} ${p.unit} de ${p.name}!`, { description: `Faturamento: R$ ${newMovement.totalValue.toFixed(2).replace('.', ',')}. Restam: ${newStock}.` }); else toast.success(`Entrada registrada: +${Math.abs(actualDelta)} ${p.unit} de ${p.name}!`, { description: `Custo: R$ ${newMovement.totalValue.toFixed(2).replace('.', ',')}. Novo total: ${newStock}.` }); if (newStock <= p.minStock && p.currentStock > p.minStock) toast.error(`Atenção: "${p.name}" atingiu o Estoque Crítico!`); return { ...p, currentStock: newStock, lastMovementDate: new Date().toISOString().split('T')[0] }; })); };
  const addProduct = (newP: Omit<Product, 'id'>) => { const product: Product = { ...newP, id: `prod-${Date.now()}` }; setProducts((prev) => [product, ...prev]); toast.success(`Produto "${product.name}" adicionado com sucesso!`); };
  const updateProduct = (updated: Product) => { setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p))); toast.success(`Produto "${updated.name}" atualizado!`); };
  const deleteProduct = (id: string) => { const p = products.find((x) => x.id === id); setProducts((prev) => prev.filter((x) => x.id !== id)); if (supabase) void supabase.from('products').delete().eq('id', id); toast.info(`Produto "${p?.name || ''}" foi removido.`); };
  const recordSupplierContact = (itemNames: string[]) => setSupplierContacts((prev) => [{ id: `supplier-${Date.now()}`, date: new Date().toISOString(), channel: 'whatsapp', itemNames }, ...prev.slice(0, 99)]);
  const recordExtraExpense = (description: string, amount: number) => { setExtraExpenses((prev) => [{ id: `expense-${Date.now()}`, date: new Date().toISOString(), description: description.trim(), amount }, ...prev.slice(0, 99)]); toast.success(`Despesa registrada: R$ ${amount.toFixed(2).replace('.', ',')}`); };
  const updateExtraExpense = (updated: ExtraExpense) => setExtraExpenses((prev) => prev.map((expense) => expense.id === updated.id ? updated : expense));
  const deleteExtraExpense = (id: string) => setExtraExpenses((prev) => prev.filter((expense) => expense.id !== id));
  const clearDemoData = () => { setProducts([]); setMovements([]); setSupplierContacts([]); setExtraExpenses([]); localStorage.setItem(STORAGE_KEY_PRODUCTS, '[]'); localStorage.setItem(STORAGE_KEY_MOVEMENTS, '[]'); localStorage.setItem(STORAGE_KEY_SUPPLIER_CONTACTS, '[]'); localStorage.setItem(STORAGE_KEY_EXTRA_EXPENSES, '[]'); localStorage.removeItem('facil_estoque_suppliers_v1'); window.dispatchEvent(new Event('facil-suppliers-updated')); toast.success('Dados de exemplo removidos.'); };
  const resetToDefault = () => clearDemoData();
  const simulateProductOldSale = (productId: string, daysAgo: number) => setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, lastMovementDate: new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0] } : p));
  const criticalProducts = products.filter((p) => isStockCritical(p.currentStock, p.minStock)); const stagnantProducts = products.map((p) => ({ product: p, days: calculateDaysSince(p.lastMovementDate) })).filter((item) => isStagnant(item.days)).sort((a, b) => b.days - a.days); const totalItems = products.reduce((acc, curr) => acc + curr.currentStock, 0);
  const dismissRealtimeSaleAlert = () => setRealtimeSaleAlert(null);
  return <StockContext.Provider value={{ products, movements, supplierContacts, extraExpenses, realtimeSaleAlert, dismissRealtimeSaleAlert, updateQuantity, addProduct, updateProduct, deleteProduct, recordSupplierContact, recordExtraExpense, updateExtraExpense, deleteExtraExpense, clearDemoData, resetToDefault, simulateProductOldSale, criticalProducts, stagnantProducts, totalItems }}>{children}</StockContext.Provider>;
};
export const useStock = () => { const context = useContext(StockContext); if (!context) throw new Error('useStock deve ser usado dentro de StockProvider'); return context; };
