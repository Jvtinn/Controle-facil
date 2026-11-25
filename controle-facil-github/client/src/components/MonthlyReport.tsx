import React from 'react';
import { BarChart3, FileSpreadsheet, Printer, TrendingUp, Wallet, X } from 'lucide-react';
import { Product, StockMovement } from '../lib/stockData';
import { ExtraExpense } from '../contexts/StockContext';
import { downloadExcel } from '../lib/exportExcel';

interface MonthlyReportProps {
  movements: StockMovement[];
  products: Product[];
  extraExpenses: ExtraExpense[];
  isOpen: boolean;
  onClose: () => void;
}

const money = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

export const MonthlyReport: React.FC<MonthlyReportProps> = ({ movements, products, extraExpenses, isOpen, onClose }) => {
  if (!isOpen) return null;

  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const monthMovements = movements.filter((movement) => movement.date.slice(0, 7) === monthKey);
  const monthExpenses = extraExpenses.filter((expense) => expense.date.slice(0, 7) === monthKey);
  const sales = monthMovements.filter((movement) => movement.type === 'sale');
  const valueOf = (movement: StockMovement) => movement.totalValue > 0 ? movement.totalValue : movement.unitValue > 0 ? movement.quantity * movement.unitValue : 0;
  const salesWithValue = sales.filter((movement) => valueOf(movement) > 0);
  const purchases = monthMovements.filter((movement) => movement.type === 'restock');
  const revenue = salesWithValue.reduce((sum, movement) => sum + valueOf(movement), 0);
  const purchaseCost = purchases.reduce((sum, movement) => sum + (movement.totalValue ?? movement.quantity * (movement.unitValue ?? 0)), 0);
  const extraCost = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const estimatedProfit = revenue - purchaseCost - extraCost;
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = previousDate.toISOString().slice(0, 7);
  const previousMovements = movements.filter((movement) => movement.date.slice(0, 7) === previousKey);
  const previousExpenses = extraExpenses.filter((expense) => expense.date.slice(0, 7) === previousKey);
  const previousRevenue = previousMovements.filter((movement) => movement.type === 'sale').reduce((sum, movement) => sum + (movement.totalValue > 0 ? movement.totalValue : movement.unitValue > 0 ? movement.quantity * movement.unitValue : 0), 0);
  const previousCost = previousMovements.filter((movement) => movement.type === 'restock').reduce((sum, movement) => sum + (movement.totalValue ?? movement.quantity * (movement.unitValue ?? 0)), 0) + previousExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const previousProfit = previousRevenue - previousCost;
  const previousMonthName = previousDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const deltaLabel = (current: number, previous: number) => previous === 0 ? (current === 0 ? 'Sem mudança' : 'Novo movimento') : `${current >= previous ? '+' : ''}${(((current - previous) / Math.abs(previous)) * 100).toFixed(0)}%`;

  const productTotals = Object.values(salesWithValue.reduce<Record<string, { name: string; quantity: number; revenue: number; cost: number }>>((result, movement) => {
    const current = result[movement.productId] || { name: movement.productName, quantity: 0, revenue: 0, cost: 0 };
    current.quantity += movement.quantity;
    current.revenue += valueOf(movement);
    current.cost += movement.quantity * (products.find((product) => product.id === movement.productId)?.costPrice ?? 0);
    result[movement.productId] = current;
    return result;
  }, {})).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);

  const exportMonthly = () => downloadExcel(`relatorio-mensal-${monthKey}`, [
    ['Relatório mensal', monthName],
    ['Faturamento', revenue],
    ['Custos', purchaseCost + extraCost],
    ['Lucro estimado', estimatedProfit],
    [],
    ['Produto', 'Quantidade vendida', 'Faturamento', 'Custo', 'Resultado estimado'],
    ...productTotals.map((product) => [product.name, product.quantity, product.revenue, product.cost, product.revenue - product.cost])
  ]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 print-report-overlay">
      <section className="print-report bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-4 border-slate-300 p-5 sm:p-8">
        <div className="print-report-actions flex flex-wrap items-center justify-between gap-3 pb-5 border-b-2 border-slate-200">
          <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center"><BarChart3 className="w-7 h-7" /></div><div><h2 className="text-2xl sm:text-3xl font-black text-slate-900">Relatório Mensal</h2><p className="text-base font-semibold text-slate-500">Resumo de {monthName}.</p></div></div>
          <div className="flex gap-2"><button type="button" onClick={exportMonthly} className="flex items-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl"><FileSpreadsheet className="w-5 h-5" />Excel</button><button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-lg"><Printer className="w-6 h-6" />Gerar PDF</button><button type="button" onClick={onClose} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600" aria-label="Fechar relatório"><X className="w-7 h-7" /></button></div>
        </div>

        <div className="report-paper pt-6">
          <header className="text-center border-b-2 border-slate-300 pb-5"><p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Controle Fácil do Estoque</p><h1 className="text-3xl sm:text-4xl font-black text-slate-950 mt-1">Relatório mensal</h1><p className="text-base font-semibold text-slate-600 mt-2 capitalize">{monthName}</p></header>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-6">
            <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-4"><div className="flex items-center gap-2 text-emerald-700 font-black"><TrendingUp className="w-5 h-5" /> Faturamento</div><p className="text-3xl font-black mt-1">{money(revenue)}</p><p className="text-sm font-semibold text-slate-600">{salesWithValue.reduce((sum, movement) => sum + movement.quantity, 0)} itens vendidos com valor</p></div>
            <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 p-4"><div className="flex items-center gap-2 text-rose-700 font-black"><Wallet className="w-5 h-5" /> Custos</div><p className="text-3xl font-black mt-1">{money(purchaseCost + extraCost)}</p><p className="text-sm font-semibold text-slate-600">compras + despesas extras</p></div>
            <div className={`rounded-2xl border-2 p-4 ${estimatedProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}><div className="flex items-center gap-2 text-blue-700 font-black"><BarChart3 className="w-5 h-5" /> Lucro estimado</div><p className="text-3xl font-black mt-1">{money(estimatedProfit)}</p><p className="text-sm font-semibold text-slate-600">faturamento menos custos</p></div>
          </div>

          <div className="mb-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50 p-4"><h3 className="text-xl font-black text-indigo-950">Comparação com {previousMonthName}</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3"><div className="bg-white/80 rounded-xl p-3"><p className="text-sm font-black text-slate-500">Faturamento</p><p className="text-lg font-black text-slate-900">{money(revenue)} <span className="text-sm text-indigo-700">({deltaLabel(revenue, previousRevenue)})</span></p><p className="text-xs font-semibold text-slate-500">Anterior: {money(previousRevenue)}</p></div><div className="bg-white/80 rounded-xl p-3"><p className="text-sm font-black text-slate-500">Lucro estimado</p><p className="text-lg font-black text-slate-900">{money(estimatedProfit)} <span className="text-sm text-indigo-700">({deltaLabel(estimatedProfit, previousProfit)})</span></p><p className="text-xs font-semibold text-slate-500">Anterior: {money(previousProfit)}</p></div></div></div>

          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden"><div className="bg-slate-100 px-4 py-3 border-b-2 border-slate-200"><h3 className="text-xl font-black text-slate-900">Produtos mais vendidos</h3><p className="text-sm font-semibold text-slate-500">Somente vendas com valor registrado entram neste ranking.</p></div>{productTotals.length === 0 ? <p className="p-8 text-center text-slate-500 font-semibold">Nenhuma venda com valor registrada neste mês.</p> : <div className="divide-y divide-slate-200">{productTotals.map((product, index) => <div key={product.name} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-4"><span className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-black">{index + 1}</span><div><p className="font-black text-slate-900">{product.name}</p><p className="text-sm font-semibold text-slate-500">{product.quantity} itens vendidos • Faturamento: {money(product.revenue)}</p><p className="text-xs font-bold text-slate-500">Custo: {money(product.cost)} • Resultado estimado: <span className={product.revenue - product.cost >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{money(product.revenue - product.cost)}</span></p></div><p className="font-black text-emerald-700">{money(product.revenue)}</p></div>)}</div>}</div>

          <footer className="mt-8 pt-4 border-t-2 border-slate-300 flex justify-between gap-4 text-xs font-semibold text-slate-500"><span>Relatório gerado pelo Controle Fácil</span><span>Lucro estimado para acompanhamento da loja</span></footer>
        </div>
      </section>
    </div>
  );
};
