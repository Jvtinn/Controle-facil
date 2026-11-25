import React from 'react';
import { X, Check, AlertCircle, ShoppingCart, AlertTriangle, PackageX } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-4 border-slate-300 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📖</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Manual Rápido do Usuário
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 border-2 border-emerald-100 p-4 flex items-center gap-4 overflow-hidden">
          <svg viewBox="0 0 180 120" className="w-36 h-24 shrink-0" role="img" aria-label="Ilustração de uma lojinha organizada">
            <path d="M18 47h144v57H18z" fill="#fff" stroke="#356b58" strokeWidth="4" strokeLinejoin="round" />
            <path d="M10 47 27 18h126l17 29H10Z" fill="#ccebd9" stroke="#356b58" strokeWidth="4" strokeLinejoin="round" />
            <path d="M37 18v29M67 18v29M97 18v29M127 18v29" stroke="#356b58" strokeWidth="4" />
            <path d="M50 104V72h28v32M104 104V72h28v32" fill="#f5e0bc" stroke="#b7792e" strokeWidth="4" />
            <circle cx="143" cy="37" r="12" fill="#e6a84b" />
            <path d="m137 37 5 5 9-11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div><p className="brand-kicker">Nosso jeitinho</p><p className="text-lg font-black text-emerald-950 mt-1">A loja organizada fica mais leve.</p><p className="text-sm font-semibold text-slate-600 mt-1">Vamos por partes: localizar, tocar e pronto.</p></div>
        </div>

        {/* Passo a Passo Super Visual */}
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-xl">
              1
            </div>
            <div>
              <h3 className="text-xl font-black text-emerald-950 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Como registrar uma venda?
              </h3>
              <p className="text-base text-emerald-900 mt-1 font-medium">
                Na aba <strong>"Registrar Venda e Entrada"</strong>, localize o produto e clique no botão vermelho <strong>"VENDI 1"</strong>. O sistema diminui a quantidade e anota a data de hoje automaticamente.
              </p>
            </div>
          </div>

          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 font-black text-xl">
              2
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-950 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                O que é o Alerta Vermelho de Estoque Crítico?
              </h3>
              <p className="text-base text-rose-900 mt-1 font-medium">
                Sempre que a quantidade de um item fica <strong>menor ou igual ao mínimo</strong>, uma faixa vermelha acende. Na aba <strong>"Falta Repor"</strong>, o sistema calcula uma <strong>Lista de Compras Automática</strong> pronta para você mandar no WhatsApp do fornecedor.
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black text-xl">
              3
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-950 flex items-center gap-2">
                <PackageX className="w-5 h-5" />
                Como funciona o Alerta Amarelo de Produtos Parados?
              </h3>
              <p className="text-base text-amber-900 mt-1 font-medium">
                Se um produto ficar <strong>de 45 a 60 dias sem nenhuma venda</strong>, ele ganha um alerta amarelo com ideias práticas, como <em>"Criar Kit de Festa"</em> ou <em>"Fazer Promoção com 20% de Desconto"</em> para girar a mercadoria antes de vencer ou ocupar espaço.
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-xl">
              4
            </div>
            <div>
              <h3 className="text-xl font-black text-blue-950 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Preciso salvar alguma coisa?
              </h3>
              <p className="text-base text-blue-900 mt-1 font-medium">
                Não! Todas as suas alterações são <strong>salvas automaticamente</strong> no seu navegador (computador, tablet ou celular) a cada toque em qualquer botão.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xl rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            Entendi! Voltar para a Loja
          </button>
        </div>
      </div>
    </div>
  );
};
