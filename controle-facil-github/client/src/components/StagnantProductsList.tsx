import React, { useState } from 'react';
import { useStock } from '../contexts/StockContext';
import { PackageX, Sparkles, Tag, ArrowRight, Clock, CheckCircle, Percent } from 'lucide-react';
import { getStagnantStatus } from '../lib/stockData';
import { toast } from 'sonner';

export const StagnantProductsList: React.FC = () => {
  const { stagnantProducts, updateQuantity, simulateProductOldSale, products } = useStock();
  const [promoCreated, setPromoCreated] = useState<Record<string, string>>({});

  const handleApplyPromo = (productId: string, productName: string, promoType: string) => {
    setPromoCreated((prev) => ({
      ...prev,
      [productId]: promoType
    }));
    toast.success(`Promoção configurada para "${productName}"!`, {
      description: `Etiqueta criada: ${promoType}. Coloque o cartaz perto do caixa!`
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner de ALERTA AMARELO conforme requisitos */}
      <div className="bg-amber-400 text-slate-950 p-5 sm:p-6 rounded-3xl shadow-lg border-4 border-amber-500 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/50 flex items-center justify-center shrink-0">
            <PackageX className="w-10 h-10 text-slate-950" />
          </div>
          <div>
            <span className="bg-slate-950 text-amber-300 font-black text-xs sm:text-sm px-3 py-1 rounded-full uppercase tracking-wider">
              ALERTA AMARELO: INVENTÁRIO LENTO
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1 leading-tight">
              {stagnantProducts.length === 0
                ? 'Nenhum produto encalhado no momento!'
                : `${stagnantProducts.length} ${
                    stagnantProducts.length === 1 ? 'produto está' : 'produtos estão'
                  } sem movimentação há 45 dias ou mais!`}
            </h2>
            <p className="text-slate-900 text-base sm:text-lg mt-1 font-medium">
              Dinheiro parado na prateleira traz prejuízo. Veja as sugestões de kits de festa e promoções com desconto para girar rápido!
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border-2 border-amber-600 text-center shrink-0">
          <span className="text-xs uppercase font-extrabold text-slate-700 block">Critério do Alerta</span>
          <span className="text-lg font-black text-slate-950">45 a 60+ dias parados</span>
        </div>
      </div>

      {stagnantProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border-2 border-slate-200">
          <div className="w-20 h-20 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 font-black">
            🎉
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-800">
            Excelente! Seu estoque está girando muito bem!
          </h3>
          <p className="text-lg text-slate-600 max-w-xl mx-auto mt-2">
            Nenhum produto está abandonado há mais de 45 dias. Caso queira testar como funciona esse alerta, você pode simular abaixo:
          </p>
          {products.length > 0 && (
            <button
              onClick={() => simulateProductOldSale(products[0].id, 50)}
              className="mt-4 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-base transition-colors"
            >
              Simular "{products[0].name}" sem vendas há 50 dias (Modo Teste)
            </button>
          )}
        </div>
      ) : (
        <div className="adaptive-card-grid">
          {stagnantProducts.map(({ product, days }) => {
            const status = getStagnantStatus(days);
            const activePromo = promoCreated[product.id];
            const discountPrice = (product.price * 0.8).toFixed(2).replace('.', ',');

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-6 border-3 border-amber-300 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 hover:border-amber-400 transition-all"
              >
                {/* Informação do Produto */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase font-extrabold px-3 py-1 bg-amber-100 text-amber-900 rounded-lg flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Sem saída há {days} dias
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Última movimentação: {product.lastMovementDate.split('-').reverse().join('/')}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {product.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-base font-semibold text-slate-700">
                    <span>
                      Estoque Parado: <strong className="text-slate-950 text-lg">{product.currentStock} {product.unit}</strong>
                    </span>
                    <span>
                      Valor Parado: <strong className="text-rose-700 text-lg">R$ {(product.currentStock * product.price).toFixed(2).replace('.', ',')}</strong>
                    </span>
                  </div>

                  {/* Ação Corretiva Sugerida pelo Sistema */}
                  <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-2xl">
                    <div className="flex items-center gap-2 text-amber-950 font-black text-base">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                      <span>AÇÃO SUGERIDA PARA HOJE:</span>
                    </div>
                    <p className="text-amber-900 font-bold text-lg mt-0.5">
                      "{status.action}"
                    </p>
                  </div>
                </div>

                {/* Opções de Ação Direta com Botões Fáceis */}
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 flex flex-col gap-3 min-w-[300px]">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
                    Criar Cartaz de Promoção Imediata
                  </span>

                  {activePromo ? (
                    <div className="bg-emerald-100 border-2 border-emerald-400 text-emerald-950 p-4 rounded-xl text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 font-black text-lg text-emerald-900">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                        Promoção em Andamento!
                      </div>
                      <p className="font-bold text-base bg-white py-1 px-3 rounded-lg border border-emerald-300">
                        {activePromo}
                      </p>
                      <button
                        onClick={() => updateQuantity(product.id, -1, 'sale')}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-all"
                      >
                        Registrar Venda com Desconto
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Botão Kit de Festa */}
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyPromo(
                            product.id,
                            product.name,
                            `Kit Festa: Leve 3 ${product.name} + Copos com 20% OFF`
                          )
                        }
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-amber-50 border-2 border-amber-300 font-bold text-slate-800 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="w-5 h-5 text-amber-600 shrink-0" />
                          <span>Montar Kit de Festa</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                      </button>

                      {/* Botão Desconto Direto 20% */}
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyPromo(
                            product.id,
                            product.name,
                            `De R$ ${product.price.toFixed(2).replace('.', ',')} por apenas R$ ${discountPrice}`
                          )
                        }
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-emerald-50 border-2 border-emerald-300 font-bold text-slate-800 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Percent className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>Promoção 20% de Desconto</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>
                  )}

                  {/* Botão de Registro Rápido caso o cliente tenha acabado de comprar */}
                  <button
                    onClick={() => updateQuantity(product.id, -1, 'sale')}
                    className="mt-1 w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Vendeu agora? Clique para dar baixa e zerar o aviso
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
