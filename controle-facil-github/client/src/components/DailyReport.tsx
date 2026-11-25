import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Printer, X, TrendingDown, TrendingUp, Package, Wallet, MessageCircle } from 'lucide-react';
import { PaymentMethod, StockMovement } from '../lib/stockData';
import { ExtraExpense, SupplierContact } from '../contexts/StockContext';
import { downloadExcel } from '../lib/exportExcel';

interface DailyReportProps {
  movements: StockMovement[];
  supplierContacts: SupplierContact[];
  extraExpenses: ExtraExpense[];
  recordExtraExpense: (description: string, amount: number) => void;
  updateExtraExpense: (expense: ExtraExpense) => void;
  deleteExtraExpense: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const money = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

export const DailyReport: React.FC<DailyReportProps> = ({ movements, supplierContacts, extraExpenses, recordExtraExpense, updateExtraExpense, deleteExtraExpense, isOpen, onClose }) => {
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentMethod>('all');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingExpenseDescription, setEditingExpenseDescription] = useState('');
  const [editingExpenseAmount, setEditingExpenseAmount] = useState('');

  if (!isOpen) return null;

  const today = new Date();
  const dateKey = today.toISOString().split('T')[0];
  const todayMovements = movements.filter((movement) => movement.date.slice(0, 10) === dateKey);
  const todayContacts = supplierContacts.filter((contact) => contact.date.slice(0, 10) === dateKey);
  const todayExtraExpenses = extraExpenses.filter((expense) => expense.date.slice(0, 10) === dateKey);
  const valueOf = (movement: StockMovement) => movement.totalValue > 0 ? movement.totalValue : movement.unitValue > 0 ? movement.quantity * movement.unitValue : 0;
  const sales = todayMovements.filter((movement) => movement.type === 'sale' && valueOf(movement) > 0 && (paymentFilter === 'all' || movement.paymentMethod === paymentFilter));
  const restocks = todayMovements.filter((movement) => movement.type === 'restock');
  const visibleMovements = todayMovements.filter((movement) => movement.type !== 'sale' || (valueOf(movement) > 0 && (paymentFilter === 'all' || movement.paymentMethod === paymentFilter)));
  const salesUnits = sales.reduce((total, movement) => total + movement.quantity, 0);
  const restockUnits = restocks.reduce((total, movement) => total + movement.quantity, 0);
  const revenue = sales.reduce((total, movement) => total + valueOf(movement), 0);
  const purchaseExpenses = restocks.reduce((total, movement) => total + (movement.totalValue ?? movement.quantity * (movement.unitValue ?? 0)), 0);
  const extraExpenseTotal = todayExtraExpenses.reduce((total, expense) => total + expense.amount, 0);
  const expenses = purchaseExpenses + extraExpenseTotal;
  const balance = revenue - expenses;
  const reportDate = today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const printReport = () => window.print();

  const addExtraExpense = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(expenseAmount.replace(',', '.'));
    if (!expenseDescription.trim() || !amount || amount <= 0) return;
    recordExtraExpense(expenseDescription, amount);
    setExpenseDescription('');
    setExpenseAmount('');
  };

  const startEditExpense = (expense: ExtraExpense) => {
    setEditingExpenseId(expense.id);
    setEditingExpenseDescription(expense.description);
    setEditingExpenseAmount(String(expense.amount).replace('.', ','));
  };

  const saveEditExpense = (expense: ExtraExpense) => {
    const amount = Number(editingExpenseAmount.replace(',', '.'));
    if (!editingExpenseDescription.trim() || !amount || amount <= 0) return;
    updateExtraExpense({ ...expense, description: editingExpenseDescription.trim(), amount });
    setEditingExpenseId(null);
  };

  const exportDaily = () => downloadExcel(`relatorio-diario-${dateKey}`, [
    ['Relatório diário', reportDate],
    ['Filtro de pagamento', paymentFilter === 'all' ? 'Todos' : paymentFilter],
    ['Faturamento', revenue],
    ['Custos de compras e extras', expenses],
    ['Saldo', balance],
    [],
    ['Tipo', 'Produto/Descrição', 'Quantidade', 'Valor', 'Pagamento', 'Data/Hora'],
    ...visibleMovements.map((movement) => [movement.type === 'sale' ? 'Venda' : 'Compra', movement.productName, movement.quantity, valueOf(movement), movement.paymentMethod || '', new Date(movement.date).toLocaleString('pt-BR')]),
    ...todayExtraExpenses.map((expense) => ['Despesa extra', expense.description, '', expense.amount, '', new Date(expense.date).toLocaleString('pt-BR')])
  ]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 print-report-overlay">
      <section className="print-report bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-4 border-slate-300 p-5 sm:p-8">
        <div className="print-report-actions flex flex-wrap items-center justify-between gap-3 pb-5 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center"><FileText className="w-7 h-7" /></div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Relatório Diário</h2>
              <p className="text-base font-semibold text-slate-500">Vendas, compras, resultado e contatos com fornecedores.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={exportDaily} className="flex items-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl"><FileSpreadsheet className="w-5 h-5" />Excel</button><button type="button" onClick={printReport} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-lg"><Printer className="w-6 h-6" />Gerar PDF</button>
            <button type="button" onClick={onClose} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600" aria-label="Fechar relatório"><X className="w-7 h-7" /></button>
          </div>
        </div>

        <div className="report-paper pt-6">
          <header className="text-center border-b-2 border-slate-300 pb-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Controle Fácil do Estoque</p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 mt-1">Relatório diário de vendas e movimentações</h1>
            <p className="text-base font-semibold text-slate-600 mt-2 capitalize">{reportDate}</p>
          </header>

          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="font-black text-slate-800">Filtrar vendas por pagamento</p>
            <div className="flex flex-wrap gap-2">
              {([['all', 'Todos'], ['pix', 'Pix'], ['dinheiro', 'Dinheiro'], ['cartao', 'Cartão']] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setPaymentFilter(value)} className={`px-4 py-2 rounded-xl border-2 font-black ${paymentFilter === value ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>{label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-6">
            <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-4">
              <div className="flex items-center gap-2 text-emerald-700 font-black"><TrendingUp className="w-5 h-5" /> Renda / vendas</div>
              <p className="text-3xl font-black text-slate-950 mt-1">{money(revenue)}</p>
              <p className="text-sm font-semibold text-slate-600">{salesUnits} itens vendidos</p>
            </div>
            <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 p-4">
              <div className="flex items-center gap-2 text-rose-700 font-black"><TrendingDown className="w-5 h-5" /> Gastos / compras</div>
              <p className="text-3xl font-black text-slate-950 mt-1">{money(expenses)}</p>
              <p className="text-sm font-semibold text-slate-600">{restockUnits} itens recebidos</p>
            </div>
            <div className={`rounded-2xl border-2 p-4 ${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 text-blue-700 font-black"><Wallet className="w-5 h-5" /> Saldo do dia</div>
              <p className="text-3xl font-black text-slate-950 mt-1">{money(balance)}</p>
              <p className="text-sm font-semibold text-slate-600">vendas menos compras</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border-2 border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-700 font-black"><MessageCircle className="w-5 h-5" /> Fornecedores</div>
              <p className="text-3xl font-black text-slate-950 mt-1">{todayContacts.length}</p>
              <p className="text-sm font-semibold text-slate-600">contatos pelo WhatsApp</p>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
            <h3 className="text-lg font-black text-amber-950">Registrar despesa extra do dia</h3>
            <p className="text-sm font-semibold text-amber-900 mb-3">Use para frete, taxa de entrega ou outro gasto que não seja uma compra de produto.</p>
            <form onSubmit={addExtraExpense} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_auto] gap-2">
              <input value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} placeholder="Ex: Frete do fornecedor" className="px-4 py-3 rounded-xl border-2 border-amber-200 bg-white font-bold outline-none" />
              <input value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} inputMode="decimal" placeholder="Valor (R$)" className="px-4 py-3 rounded-xl border-2 border-amber-200 bg-white font-bold outline-none" />
              <button type="submit" className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black">Adicionar</button>
            </form>
            {todayExtraExpenses.length > 0 && <div className="mt-3 space-y-2"><p className="text-sm font-black text-amber-950">Despesas extras lançadas hoje</p>{todayExtraExpenses.map((expense) => editingExpenseId === expense.id ? (
              <div key={expense.id} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_auto_auto] gap-2 items-center"><input value={editingExpenseDescription} onChange={(event) => setEditingExpenseDescription(event.target.value)} className="px-3 py-2 rounded-lg border-2 border-amber-300 bg-white font-bold" /><input value={editingExpenseAmount} onChange={(event) => setEditingExpenseAmount(event.target.value)} className="px-3 py-2 rounded-lg border-2 border-amber-300 bg-white font-bold" /><button type="button" onClick={() => saveEditExpense(expense)} className="px-3 py-2 rounded-lg bg-emerald-700 text-white font-black">Salvar</button><button type="button" onClick={() => setEditingExpenseId(null)} className="px-3 py-2 rounded-lg bg-white text-slate-700 font-bold">Cancelar</button></div>
            ) : <div key={expense.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 border border-amber-200 px-3 py-2"><span className="text-sm font-bold text-amber-950">{expense.description} — {money(expense.amount)}</span><span className="flex gap-2"><button type="button" onClick={() => startEditExpense(expense)} className="text-sm font-black text-blue-700 hover:underline">Editar</button><button type="button" onClick={() => deleteExtraExpense(expense.id)} className="text-sm font-black text-rose-700 hover:underline">Excluir</button></span></div>)}</div>}
          </div>

          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b-2 border-slate-200"><h3 className="text-xl font-black text-slate-900">Detalhamento financeiro e de estoque</h3></div>
            {visibleMovements.length === 0 ? (
              <div className="p-8 text-center text-slate-500"><p className="text-lg font-bold">Nenhuma movimentação registrada hoje.</p><p className="text-sm mt-1">As vendas e entradas aparecerão aqui depois dos lançamentos.</p></div>
            ) : (
              <div className="divide-y divide-slate-200">
                {visibleMovements.map((movement) => {
                  const isSale = movement.type === 'sale';
                  const value = valueOf(movement);
                  const time = new Date(movement.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={movement.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${isSale ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{isSale ? 'VENDA' : 'COMPRA'}</span>
                      <div><p className="font-black text-slate-900">{movement.productName}</p><p className="text-xs font-semibold text-slate-500">{movement.quantity} un • Estoque: {movement.previousStock} → {movement.newStock} • {time}{isSale && movement.paymentMethod ? ` • Pagamento: ${movement.paymentMethod === 'pix' ? 'Pix' : movement.paymentMethod === 'dinheiro' ? 'Dinheiro' : 'Cartão'}` : ''}</p></div>
                      <div className="text-right"><p className={`font-black ${isSale ? 'text-emerald-700' : 'text-rose-700'}`}>{isSale ? '+' : '-'}{money(value)}</p><p className="text-xs font-bold text-slate-500">{money(movement.unitValue ?? 0)}/un</p></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 border-2 border-slate-200 rounded-2xl p-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-emerald-700" /> Contatos com fornecedores</h3>
            {todayContacts.length === 0 ? <p className="text-sm font-semibold text-slate-500 mt-2">Nenhum contato de fornecedor registrado hoje.</p> : (
              <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-700">
                {todayContacts.map((contact) => <li key={contact.id}>• WhatsApp às {new Date(contact.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}: {contact.itemNames.join(', ')}</li>)}
              </ul>
            )}
          </div>

          <footer className="mt-8 pt-4 border-t-2 border-slate-300 flex justify-between gap-4 text-xs font-semibold text-slate-500"><span>Relatório gerado pelo Controle Fácil</span><span>Documento para conferência interna da loja</span></footer>
        </div>
      </section>
    </div>
  );
};
