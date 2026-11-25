import React, { useState } from 'react';
import { useStock } from '../contexts/StockContext';
import { Minus, Plus, Search, CheckCircle2, AlertOctagon, Sparkles, ScanLine, Volume2 } from 'lucide-react';
import { calculateDaysSince, getStagnantStatus, isStockCritical } from '../lib/stockData';
import { PaymentMethod } from '../lib/stockData';
import { BarcodeScanner } from './BarcodeScanner';

export const QuickOperations: React.FC = () => {
  const { products, updateQuantity } = useStock();
  const [searchTerm, setSearchTerm] = useState('');
  const [codeTerm, setCodeTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentAction, setRecentAction] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanSaleMode, setScanSaleMode] = useState(true);
  const [scannedProductId, setScannedProductId] = useState<string | null>(null);
  const [pendingSale, setPendingSale] = useState<{ productId: string; name: string; quantity: number } | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCode = !codeTerm.trim() || (p.barcode || '').toLowerCase().includes(codeTerm.trim().toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCode && matchesCategory;
  });

  const groupedProducts = Array.from(new Set(filteredProducts.map((p) => p.category)))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((category) => ({
      category,
      products: filteredProducts
        .filter((product) => product.category === category)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    }));

  const requestSale = (productId: string, name: string, quantity: number) => {
    setPendingSale({ productId, name, quantity });
  };

  const confirmSale = (paymentMethod: PaymentMethod) => {
    if (!pendingSale) return;
    updateQuantity(pendingSale.productId, -pendingSale.quantity, 'sale', paymentMethod);
    setRecentAction(`Venda registrada: ${pendingSale.quantity} un de ${pendingSale.name}`);
    setTimeout(() => setRecentAction(null), 3000);
    setPendingSale(null);
  };

  const handleRestock = (productId: string, name: string) => {
    updateQuantity(productId, 1, 'restock');
    setRecentAction(`Chegou no estoque: +1 un de ${name}`);
    setTimeout(() => setRecentAction(null), 3000);
  };

  const handleBarcodeDetected = (code: string) => {
    const product = products.find((p) => p.barcode === code);
    setCodeTerm(code);
    setSearchTerm(product?.name || '');
    setSelectedCategory('all');
    if (product) {
      const audioContext = new window.AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.16);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.17);
      void audioContext.close();
      setScannedProductId(product.id);
      window.setTimeout(() => setScannedProductId(null), 1800);
      if (scanSaleMode && product.currentStock > 0) {
        requestSale(product.id, product.name, 1);
        setRecentAction(`Produto lido: confirme a venda de ${product.name}`);
      } else {
        setRecentAction(`Produto encontrado: ${product.name}`);
      }
    } else {
      setRecentAction(`Código ${code} não cadastrado — confira a Lista de Produtos`);
    }
    setTimeout(() => setRecentAction(null), 4000);
  };

  const handleCodeSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const code = codeTerm.trim();
    if (!code) return;
    const product = products.find((p) => (p.barcode || '').toLowerCase() === code.toLowerCase());
    setSearchTerm(product?.name || '');
    setSelectedCategory(product?.category || 'all');
    if (product && scanSaleMode && product.currentStock > 0) {
      requestSale(product.id, product.name, 1);
      setRecentAction(`Produto lido: confirme a venda de ${product.name}`);
    } else {
      setRecentAction(product ? `Produto encontrado: ${product.name}` : `Código/QR não cadastrado: ${code}`);
    }
    setTimeout(() => setRecentAction(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner de instrução clara e amigável */}
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-3xl shrink-0">
            👋
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
              Dar Baixa em Vendas ou Entrada de Mercadorias
            </h2>
            <p className="text-base text-emerald-900 mt-0.5">
              Toque no <strong>botão VERMELHO (-)</strong> quando vender um item. Toque no <strong>botão VERDE (+)</strong> quando receber mercadoria do fornecedor.
            </p>
          </div>
        </div>

        {recentAction && (
          <div className="bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 animate-bounce text-base">
            <CheckCircle2 className="w-6 h-6 text-emerald-200" />
            <span>{recentAction}</span>
          </div>
        )}
      </div>

      {/* Barra de Pesquisa com Letras Grandes */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-200 flex flex-col md:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search className="w-7 h-7 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o nome do produto (ex: Arroz, Café...)"
            className="w-full pl-14 pr-4 py-3.5 text-lg sm:text-xl rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none font-medium placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 font-bold px-2 py-1 bg-slate-100 rounded-lg text-sm"
            >
              Limpar
            </button>
          )}
        </div>

        <form onSubmit={handleCodeSubmit} className="flex min-w-0 md:w-[340px] gap-2">
          <input
            type="text"
            value={codeTerm}
            onChange={(e) => setCodeTerm(e.target.value)}
            placeholder="Código de barras ou QR Code"
            className="min-w-0 flex-1 px-4 py-3.5 text-lg rounded-xl border-2 border-blue-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none font-bold placeholder:text-slate-400"
            aria-label="Código de barras ou QR Code"
          />
          <button type="submit" className="px-4 py-3.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-black" title="Buscar código digitado">
            OK
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-sm whitespace-nowrap"
          title="Abrir câmera para ler o código de barras"
        >
          <ScanLine className="w-7 h-7" />
          <span>Ler código</span>
        </button>

        <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 font-black text-sm cursor-pointer">
          <input type="checkbox" checked={scanSaleMode} onChange={(event) => setScanSaleMode(event.target.checked)} className="w-5 h-5 accent-emerald-600" />
          Ler e vender
        </label>

        {/* Filtro de Categoria com Botões Grandes */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-3 rounded-xl font-bold text-base whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              {cat === 'all' ? 'Ver Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Produtos agrupados por categoria — no modo “Ver Todos”, uma seção vem abaixo da outra */}
      <div className="space-y-8">
        {groupedProducts.map((group) => (
          <section key={group.category} aria-labelledby={`category-${group.category}`}>
            <div className="flex items-center gap-3 mb-3">
              <h3 id={`category-${group.category}`} className="text-2xl font-black text-slate-900">
                {group.category}
              </h3>
              <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-sm font-black">
                {group.products.length} {group.products.length === 1 ? 'produto' : 'produtos'}
              </span>
              <div className="h-0.5 bg-slate-300 flex-1" />
            </div>
            <div className="adaptive-card-grid">
              {group.products.map((product) => {
          const isCritical = isStockCritical(product.currentStock, product.minStock);
          const daysStagnant = calculateDaysSince(product.lastMovementDate);
          const stagnantInfo = getStagnantStatus(daysStagnant);

          return (
            <div
              key={product.id}
              className={`bg-white rounded-3xl p-5 border-3 shadow-sm flex flex-col justify-between transition-all ${scannedProductId === product.id ? 'ring-4 ring-emerald-300 ring-offset-2 scale-[1.01]' : ''} ${
                isCritical
                  ? 'border-rose-400 bg-rose-50/20'
                  : stagnantInfo.isStagnant
                  ? 'border-amber-400 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Topo do Card */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-bold uppercase tracking-wider px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">
                    {product.category}
                  </span>

                  {/* Badges de Alerta */}
                  <div className="flex flex-col items-end gap-1">
                    {isCritical && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse">
                        <AlertOctagon className="w-4 h-4" />
                        ESTOQUE CRÍTICO
                      </span>
                    )}
                    {stagnantInfo.isStagnant && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                        <Sparkles className="w-4 h-4" />
                        PARADO HÁ {daysStagnant} DIAS
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 leading-snug">
                  {product.name}
                </h3>
                <p className="text-base font-semibold text-slate-500 mt-0.5">
                  Preço de Venda (1 {product.unit}): R$ {product.price.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Informações Centrais de Estoque */}
              <div className="my-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                    Quantidade no Estoque
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-black ${
                        isCritical ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {product.currentStock}
                    </span>
                    <span className="text-xl font-bold text-slate-600">
                      {product.unit}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                    Estoque Mínimo
                  </span>
                  <div className="text-xl font-bold text-slate-700">
                    {product.minStock} {product.unit}
                  </div>
                  {isCritical ? (
                    <span className="text-xs font-extrabold text-rose-600">
                      Falta comprar: {Math.max(1, product.minStock * 2 - product.currentStock)} {product.unit}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700">
                      Estoque Seguro ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Sugestão de Promoção se estiver parado */}
              {stagnantInfo.isStagnant && (
                <div className="mb-4 p-3 bg-amber-100 border-2 border-amber-300 rounded-xl text-amber-950 text-sm">
                  <p className="font-extrabold flex items-center gap-1.5">
                    💡 Sugestão para não perder dinheiro:
                  </p>
                  <p className="font-semibold text-xs mt-0.5">
                    {stagnantInfo.action}
                  </p>
                </div>
              )}

              {/* BOTÕES GIGANTES DE AÇÃO (+ e -) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Botão de VENDA (-) */}
                <button
                  type="button"
                  onClick={() => requestSale(product.id, product.name, 1)}
                  disabled={product.currentStock <= 0}
                  className={`flex items-center justify-center gap-2 py-4 px-3 rounded-2xl font-black text-lg sm:text-xl transition-all shadow-md ${
                    product.currentStock <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                  }`}
                  title="Diminuir 1 un por venda"
                >
                  <Minus className="w-8 h-8 stroke-[3]" />
                  <span>VENDI 1</span>
                </button>

                {/* Botão de ENTRADA (+) */}
                <button
                  type="button"
                  onClick={() => handleRestock(product.id, product.name)}
                  className="flex items-center justify-center gap-2 py-4 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg sm:text-xl transition-all shadow-md active:scale-95"
                  title="Aumentar 1 un por reposição"
                >
                  <Plus className="w-8 h-8 stroke-[3]" />
                  <span>CHEGOU +1</span>
                </button>
              </div>

              {/* Atalhos para vendas e reposições em quantidade */}
              <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-slate-500 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span>Vendeu vários:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => requestSale(product.id, product.name, 5)}
                      disabled={product.currentStock <= 0}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold disabled:opacity-40"
                    >
                      -5 {product.unit}
                    </button>
                    <button
                      type="button"
                      onClick={() => requestSale(product.id, product.name, 10)}
                      disabled={product.currentStock <= 0}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold disabled:opacity-40"
                    >
                      -10 {product.unit}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Chegou em quantidade:</span>
                  <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, 5, 'restock')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 border border-slate-200 font-bold"
                  >
                    +5 {product.unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, 10, 'restock')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 border border-slate-200 font-bold"
                  >
                    +10 {product.unit}
                  </button>
                  </div>
                </div>
              </div>
            </div>
          );
              })}
            </div>
          </section>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8">
          <p className="text-2xl font-bold text-slate-600">Nenhum produto encontrado</p>
          <p className="text-slate-500 mt-2">Tente buscar por outra palavra ou limpe o campo de busca.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCodeTerm('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-6 py-3 bg-slate-800 text-white font-bold rounded-xl text-lg"
          >
            Mostrar todos os produtos
          </button>
        </div>
      )}

      {pendingSale && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-slate-200">
            <h2 className="text-2xl font-black text-slate-900">Confirmar produto lido</h2>
            <p className="text-base font-semibold text-slate-500 mt-1">Venda de {pendingSale.quantity} unidade(s) de {pendingSale.name}</p>
            <div className="mt-3 rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">Nada foi baixado ainda. Escolha o pagamento somente se o produto estiver correto.</div>
            <div className="grid grid-cols-1 gap-3 mt-6">
              <button type="button" onClick={() => confirmSale('pix')} className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black">Pix</button>
              <button type="button" onClick={() => confirmSale('dinheiro')} className="p-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xl font-black">Dinheiro</button>
              <button type="button" onClick={() => confirmSale('cartao')} className="p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xl font-black">Cartão</button>
            </div>
            <button type="button" onClick={() => setPendingSale(null)} className="w-full mt-4 py-4 rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-black text-lg">Cancelar leitura — não registrar venda</button>
          </div>
        </div>
      )}

      {scannedProductId && (
        <div role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-white font-black shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <Volume2 className="w-6 h-6 text-emerald-200" /> Código reconhecido com sucesso
        </div>
      )}

      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />
    </div>
  );
};
