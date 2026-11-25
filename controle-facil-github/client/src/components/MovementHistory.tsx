import React, { useState } from 'react';
import { useStock } from '../contexts/StockContext';
import { History, TrendingDown, TrendingUp, Calendar, FileText, Wallet } from 'lucide-react';
import { DailyReport } from './DailyReport';
import { MonthlyReport } from './MonthlyReport';

export const MovementHistory: React.FC = () => {
  const { products, movements, supplierContacts, extraExpenses, recordExtraExpense, updateExtraExpense, deleteExtraExpense } = useStock();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);

  const totalSales = movements
    .filter((m) => m.type === 'sale')
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const totalRestock = movements
    .filter((m) => m.type === 'restock')
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const totalRevenue = movements
    .filter((m) => m.type === 'sale')
    .reduce((acc, curr) => acc + (curr.totalValue ?? curr.quantity * (curr.unitValue ?? 0)), 0);

  const totalExpenses = movements
    .filter((m) => m.type === 'restock')
    .reduce((acc, curr) => acc + (curr.totalValue ?? curr.quantity * (curr.unitValue ?? 0)), 0);

  return (
    <div className="space-y-6">
      {/* Resumo Rápido em Cartões Grandes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold text-slate-500">
              Vendas Registradas Hoje
            </span>
            <p className="text-3xl font-black text-slate-900">
              {totalSales} <span className="text-base font-bold text-slate-500">itens</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold text-slate-500">
              Reposições de Fornecedores
            </span>
            <p className="text-3xl font-black text-slate-900">
              {totalRestock} <span className="text-base font-bold text-slate-500">itens</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold text-slate-500">Renda registrada</span>
            <p className="text-2xl font-black text-slate-900">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold text-slate-500">Gastos registrados</span>
            <p className="text-2xl font-black text-slate-900">R$ {totalExpenses.toFixed(2).replace('.', ',')}</p>
            <p className="text-xs font-bold text-slate-500">{supplierContacts.length} contato(s) fornecedor</p>
          </div>
        </div>
      </div>

      {/* Lista de Movimentações Recentes */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-slate-100">
          <div className="flex items-center gap-3">
            <History className="w-7 h-7 text-slate-700" />
            <h3 className="text-2xl font-black text-slate-900">
              Registro de Movimentações Recentes
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setIsReportOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow-sm"><FileText className="w-6 h-6" />Relatório do dia</button>
            <button type="button" onClick={() => setIsMonthlyReportOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg rounded-xl shadow-sm"><Wallet className="w-6 h-6" />Relatório mensal</button>
          </div>
        </div>

        {movements.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p className="text-xl font-bold">Nenhuma movimentação registrada nesta sessão ainda.</p>
            <p className="mt-1">
              Assim que você clicar em "VENDI 1" ou "CHEGOU +1", as ações aparecerão aqui com data e hora.
            </p>
          </div>
        ) : (
          <div className="divide-y-2 divide-slate-100 mt-3">
            {movements.map((m) => {
              const isSale = m.type === 'sale';
              const dateObj = new Date(m.date);
              const formattedTime = dateObj.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              });
              const formattedDate = dateObj.toLocaleDateString('pt-BR');

              return (
                <div
                  key={m.id}
                  className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg ${
                        isSale ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isSale ? '-' : '+'}
                    </div>

                    <div>
                      <h4 className="text-xl font-black text-slate-900">{m.productName}</h4>
                      <p className="text-sm font-semibold text-slate-500">
                        {isSale ? 'Saída por Venda' : 'Entrada de Reposição'} • Estoque foi de{' '}
                        <strong>{m.previousStock}</strong> para <strong>{m.newStock}</strong>
                        {isSale && m.paymentMethod ? ` • ${m.paymentMethod === 'pix' ? 'Pix' : m.paymentMethod === 'dinheiro' ? 'Dinheiro' : 'Cartão'}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                    <span
                      className={`text-xl font-black px-3 py-1 rounded-xl ${
                        isSale ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isSale ? `-${m.quantity}` : `+${m.quantity}`}
                    </span>
                    <span className={`text-sm font-black ${isSale ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isSale ? '+' : '-'}R$ {(m.totalValue ?? m.quantity * (m.unitValue ?? 0)).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate} às {formattedTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DailyReport
        movements={movements}
        supplierContacts={supplierContacts}
        extraExpenses={extraExpenses}
        recordExtraExpense={recordExtraExpense}
        updateExtraExpense={updateExtraExpense}
        deleteExtraExpense={deleteExtraExpense}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
      <MonthlyReport products={products} movements={movements} extraExpenses={extraExpenses} isOpen={isMonthlyReportOpen} onClose={() => setIsMonthlyReportOpen(false)} />
    </div>
  );
};
