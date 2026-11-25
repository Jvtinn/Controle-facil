import React, { useEffect, useState } from 'react';
import { MessageCircle, Pencil, Phone, Plus, Save, Store, Trash2, Truck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCloud } from '../contexts/CloudContext';

export interface Supplier { id: string; name: string; phone: string; }
export const STORAGE_KEY = 'facil_estoque_suppliers_v1';

export const Suppliers: React.FC = () => {
  const { profile } = useCloud();
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { return JSON.parse(saved); } catch { return []; } }
    return [];
  });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => {
    const refresh = () => { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setSuppliers(JSON.parse(saved)); };
    window.addEventListener('facil-suppliers-updated', refresh);
    return () => window.removeEventListener('facil-suppliers-updated', refresh);
  }, []);
  useEffect(() => {
    if (!supabase || !profile?.store_id) return;
    supabase.from('suppliers').select('id, name, phone').eq('store_id', profile.store_id).order('name').then(({ data, error }) => {
      if (!error && data) setSuppliers(data as Supplier[]);
    });
  }, [profile?.store_id]);

  const saveSupplier = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const next = editingId ? { id: editingId, name: name.trim(), phone: phone.trim() } : { id: `supplier-${Date.now()}`, name: name.trim(), phone: phone.trim() };
    setSuppliers((prev) => editingId ? prev.map((item) => item.id === editingId ? next : item) : [next, ...prev]);
    if (supabase && profile?.store_id) void supabase.from('suppliers').upsert({ ...next, store_id: profile.store_id });
    setName(''); setPhone(''); setEditingId(null);
  };
  const editSupplier = (supplier: Supplier) => { setEditingId(supplier.id); setName(supplier.name); setPhone(supplier.phone); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const removeSupplier = (id: string) => { if (window.confirm('Excluir este fornecedor?')) { setSuppliers((prev) => prev.filter((item) => item.id !== id)); if (supabase) void supabase.from('suppliers').delete().eq('id', id); } };
  const whatsappLink = (rawPhone: string) => { const digits = rawPhone.replace(/\D/g, ''); return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`; };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 p-5 sm:p-6 flex items-center gap-4"><div className="brand-mark w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"><Truck className="w-8 h-8 text-emerald-800" /></div><div><p className="brand-kicker">Parceiros da loja</p><h2 className="text-2xl sm:text-3xl font-black text-emerald-950">Fornecedores</h2><p className="text-base font-semibold text-slate-600">Deixe os contatos importantes sempre à mão.</p></div></div>
      <form onSubmit={saveSupplier} className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-sm"><div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-2"><Plus className="w-6 h-6 text-emerald-700" /><h3 className="text-xl font-black text-slate-900">{editingId ? 'Editar fornecedor' : 'Cadastrar fornecedor'}</h3></div>{editingId && <button type="button" onClick={() => { setEditingId(null); setName(''); setPhone(''); }} className="flex items-center gap-1 text-slate-600 font-bold"><X className="w-4 h-4" />Cancelar edição</button>}</div><div className="grid grid-cols-1 md:grid-cols-[1fr_240px_auto] gap-3"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do fornecedor" className="px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-lg font-bold" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefone / WhatsApp" inputMode="tel" className="px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-emerald-600 outline-none text-lg font-bold" /><button type="submit" className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-lg">{editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}{editingId ? 'Salvar' : 'Adicionar'}</button></div></form>
      {suppliers.length === 0 ? <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-10 text-center"><Store className="w-12 h-12 text-slate-300 mx-auto" /><p className="text-xl font-black text-slate-600 mt-3">Nenhum fornecedor cadastrado</p><p className="text-slate-500 font-semibold mt-1">Cadastre o primeiro contato acima.</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{suppliers.map((supplier) => <article key={supplier.id} className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-sm flex items-center justify-between gap-4"><div className="flex items-center gap-3 min-w-0"><div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0"><Store className="w-6 h-6" /></div><div className="min-w-0"><h3 className="text-xl font-black text-slate-900 truncate">{supplier.name}</h3><p className="text-base font-semibold text-slate-500 flex items-center gap-1"><Phone className="w-4 h-4" />{supplier.phone}</p></div></div><div className="flex items-center gap-2 shrink-0"><a href={whatsappLink(supplier.phone)} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" title="Abrir conversa no WhatsApp"><MessageCircle className="w-6 h-6" /></a><button type="button" onClick={() => editSupplier(supplier)} className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700" title="Editar fornecedor"><Pencil className="w-5 h-5" /></button><button type="button" onClick={() => removeSupplier(supplier.id)} className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700" title="Excluir fornecedor"><Trash2 className="w-5 h-5" /></button></div></article>)}</div>}
    </div>
  );
};
