import React, { useState } from 'react';
import { useStock } from '../contexts/StockContext';
import { AlertOctagon, ShoppingBag, Printer, Share2, Check, Plus, AlertCircle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export const CriticalStockList: React.FC = () => {
  const { criticalProducts, updateQuantity, recordSupplierContact } = useStock();
  const [copied, setCopied] = useState(false);

  // Lista com quantidade sugerida de compra: (Estoque Mínimo * 2) - Estoque Atual
  const shoppingItems = criticalProducts.map((p) => {
    const suggestedBuy = Math.max(1, p.minStock * 2 - p.currentStock);
    return {
      ...p,
      suggestedBuy
    };
  });

  const handleCopyShoppingList = () => {
    if (shoppingItems.length === 0) {
      toast.info('Não há itens para comprar no momento!');
      return;
    }

    const textList = [
      '🛒 LISTA DE COMPRAS PARA O FORNECEDOR',
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      '----------------------------------------',
      ...shoppingItems.map(
        (item) => `[ ] ${item.name} -> Comprar: ${item.suggestedBuy} ${item.unit} (Restam só: ${item.currentStock})`
      ),
      '----------------------------------------',
      'Gerado automaticamente pelo Controle Fácil de Estoque'
    ].join('\n');

    navigator.clipboard.writeText(textList).then(() => {
      setCopied(true);
      toast.success('Lista de compras copiada para o WhatsApp!', {
        description: 'Agora basta colar na conversa com o fornecedor ou vendedor.'
      });
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleSendWhatsApp = () => {
    if (shoppingItems.length === 0) {
      toast.info('Não há itens para comprar no momento!');
      return;
    }

    const textList = [
      '🛒 *LISTA DE COMPRAS — CONTROLE FÁCIL*',
      `📅 Data: ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      '*Itens para reposição:*',
      ...shoppingItems.map(
        (item) => `☐ ${item.name} — comprar *${item.suggestedBuy} ${item.unit}* (restam ${item.currentStock})${item.supplierName ? ` — fornecedor: ${item.supplierName}` : ''}`
      ),
      '',
      'Por favor, confirme disponibilidade e prazo de entrega. Obrigado!'
    ].join('\n');

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(textList)}`;
    recordSupplierContact(shoppingItems.map((item) => item.name));
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    toast.success('WhatsApp aberto com a lista pronta!', {
      description: 'Agora selecione o fornecedor para enviar a mensagem.'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Banner de ALERTA VERMELHO destacando os requisitos do negócio */}
      <div className="bg-rose-600 text-white p-5 sm:p-6 rounded-3xl shadow-lg border-4 border-rose-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-10 h-10 text-white animate-bounce" />
          </div>
          <div>
            <span className="bg-yellow-400 text-rose-950 font-black text-xs sm:text-sm px-3 py-1 rounded-full uppercase tracking-wider">
              ALERTA DE ESTOQUE CRÍTICO
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1 leading-tight">
              {criticalProducts.length === 0
                ? 'Nenhum produto em estoque crítico!'
                : `Atenção: ${criticalProducts.length} ${
                    criticalProducts.length === 1 ? 'item precisa' : 'itens precisam'
                  } de reposição imediata!`}
            </h2>
            <p className="text-white/90 text-base sm:text-lg mt-1 font-medium">
              O estoque destes itens está menor ou igual ao Estoque Mínimo configurado.
            </p>
          </div>
        </div>

        {criticalProducts.length > 0 && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={handleCopyShoppingList}
              type="button"
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-rose-950 font-black text-lg rounded-2xl shadow-md transition-all active:scale-95"
            >
              {copied ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
              <span>{copied ? 'Copiado!' : 'Copiar para WhatsApp'}</span>
            </button>
            <button
              onClick={handleSendWhatsApp}
              type="button"
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-lg rounded-2xl shadow-md transition-all active:scale-95"
              title="Abrir o WhatsApp com a mensagem da lista"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Enviar no WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white/20 hover:bg-white/30 text-white font-bold text-lg rounded-2xl transition-all"
              title="Imprimir lista"
            >
              <Printer className="w-6 h-6" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        )}
      </div>

      {criticalProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border-2 border-slate-200">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 font-black">
            ✓
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800">
            Tudo em ordem com o seu estoque!
          </h3>
          <p className="text-lg text-slate-600 max-w-xl mx-auto mt-2">
            Todos os produtos estão com quantidades acima do mínimo de segurança. Você não precisa fazer nenhum pedido urgente agora.
          </p>
        </div>
      ) : (
        <>
          {/* TABELA VISUAL / CARDS DA LISTA DE COMPRAS AUTOMÁTICA */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-3 border-rose-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-7 h-7 text-rose-600" />
                <h3 className="text-2xl font-black text-slate-900">
                  Lista de Compras Automática
                </h3>
              </div>
              <span className="text-base font-bold text-slate-500">
                Total a comprar: {shoppingItems.reduce((acc, c) => acc + c.suggestedBuy, 0)} unidades
              </span>
            </div>

            <div className="divide-y-2 divide-slate-100 mt-4">
              {shoppingItems.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-rose-50/40 p-3 rounded-2xl transition-colors"
                >
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-bold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {item.category}
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                      {item.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base font-semibold">
                      <span className="text-rose-600 bg-rose-100 px-2 py-0.5 rounded-lg font-bold">
                        Estoque Atual: {item.currentStock} {item.unit}
                      </span>
                      <span className="text-slate-600">
                        Estoque Mínimo Seguro: {item.minStock} {item.unit}
                      </span>
                      <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg font-bold">
                        {item.supplierName ? `Fornecedor: ${item.supplierName}` : 'Sem fornecedor vinculado'}
                      </span>
                    </div>
                  </div>

                  {/* Ação de Sugestão de Compra e Botão de Entrada Rápida */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="bg-amber-100 border-2 border-amber-300 px-4 py-2 rounded-2xl text-center">
                      <span className="text-xs uppercase font-extrabold text-amber-900 block">
                        Sugestão de Compra
                      </span>
                      <span className="text-2xl font-black text-amber-950">
                        +{item.suggestedBuy} {item.unit}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.suggestedBuy, 'restock')}
                      className="flex items-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-sm transition-all active:scale-95 whitespace-nowrap"
                      title="Marcar como recebido após a compra"
                    >
                      <Plus className="w-6 h-6" />
                      <span>Chegou Tudo!</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dica amigável para os funcionários e dona da loja */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-blue-900">
            <AlertCircle className="w-6 h-6 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-base font-medium">
              <strong>Como funciona a Lista Automática?</strong> O sistema calcula a quantidade que falta para você repor com folga o dobro do estoque mínimo. Ao clicar em <strong>"Chegou Tudo!"</strong>, o estoque é atualizado de uma só vez assim que o entregador trouxer os pacotes.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
