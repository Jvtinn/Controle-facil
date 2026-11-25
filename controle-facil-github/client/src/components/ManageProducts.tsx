import React, { useState } from 'react';
import { useStock } from '../contexts/StockContext';
import { PlusCircle, Edit3, Trash2, Save, X, RotateCcw, Truck } from 'lucide-react';
import { Product } from '../lib/stockData';
import { STORAGE_KEY as SUPPLIERS_STORAGE_KEY, Supplier } from './Suppliers';
import { useCloud } from '../contexts/CloudContext';

export const ManageProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, resetToDefault } = useStock();
  const { profile } = useCloud();
  const canDelete = !profile || profile.role === 'owner';
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => JSON.parse(localStorage.getItem(SUPPLIERS_STORAGE_KEY) || '[]'));

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form de cadastro
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Alimentos');
  const [unit, setUnit] = useState('un');
  const [price, setPrice] = useState('10.00');
  const [costPrice, setCostPrice] = useState('7.00');
  const [currentStock, setCurrentStock] = useState('10');
  const [minStock, setMinStock] = useState('5');
  const [barcode, setBarcode] = useState('');
  const [supplierId, setSupplierId] = useState('');

  // Form de edição
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');

  React.useEffect(() => {
    const refresh = () => setSuppliers(JSON.parse(localStorage.getItem(SUPPLIERS_STORAGE_KEY) || '[]'));
    window.addEventListener('facil-suppliers-updated', refresh);
    return () => window.removeEventListener('facil-suppliers-updated', refresh);
  }, []);

  const handleStartEdit = (p: Product) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditCategory(p.category);
    setEditPrice(p.price.toString());
    setEditCostPrice((p.costPrice ?? p.price * 0.7).toFixed(2));
    setEditMinStock(p.minStock.toString());
    setEditSupplierId(p.supplierId || '');
  };

  const handleSaveEdit = (p: Product) => {
    updateProduct({
      ...p,
      name: editName,
      category: editCategory,
      price: parseFloat(editPrice) || p.price,
      costPrice: parseFloat(editCostPrice) || p.costPrice || p.price * 0.7,
      minStock: parseInt(editMinStock, 10) || p.minStock
      ,supplierId: editSupplierId || undefined,
      supplierName: suppliers.find((supplier) => supplier.id === editSupplierId)?.name
    });
    setEditingId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProduct({
      name: name.trim(),
      category: category.trim() || 'Geral',
      unit,
      price: parseFloat(price.replace(',', '.')) || 0,
      costPrice: parseFloat(costPrice.replace(',', '.')) || 0,
      currentStock: parseInt(currentStock, 10) || 0,
      minStock: parseInt(minStock, 10) || 1,
      barcode: barcode.trim() || undefined,
      supplierId: supplierId || undefined,
      supplierName: suppliers.find((supplier) => supplier.id === supplierId)?.name,
      lastMovementDate: new Date().toISOString().split('T')[0]
    });

    setName('');
    setCostPrice('7.00');
    setBarcode('');
    setSupplierId('');
    setIsAdding(false);
  };

  const groupedProducts = Array.from(new Set(products.map((p) => p.category)))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((category) => ({
      category,
      products: products
        .filter((product) => product.category === category)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    }));

  return (
    <div className="space-y-6">
      {/* Topo com Botão de Novo Produto e Reset */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Cadastrar e Ajustar Produtos
          </h2>
          <p className="text-base text-slate-600 font-medium">
            Aqui você define o Estoque Mínimo para os alertas automáticos funcionarem perfeitamente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-md transition-all active:scale-95"
          >
            {isAdding ? <X className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
            <span>{isAdding ? 'Fechar Formulário' : '+ Novo Produto'}</span>
          </button>

          <button
            type="button"
            onClick={resetToDefault}
            className="p-3 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors"
            title="Restaurar lista de exemplo padrão"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Formulário de Adicionar com Campos Claros e Grandes */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="bg-blue-50 border-3 border-blue-300 p-6 rounded-3xl shadow-sm space-y-4"
        >
          <h3 className="text-xl sm:text-2xl font-black text-blue-950">
            Preencha os dados do novo produto:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-black text-blue-900 uppercase mb-1">
                Nome do Produto
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sabão em Pó 1kg"
                className="w-full p-3.5 text-lg rounded-xl border-2 border-blue-200 bg-white font-bold outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-blue-900 uppercase mb-1">
                Categoria / Seção
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Limpeza, Alimentos, Bebidas"
                className="w-full p-3.5 text-lg rounded-xl border-2 border-blue-200 bg-white font-bold outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-blue-900 uppercase mb-1">
                Unidade de Medida
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-3.5 text-lg rounded-xl border-2 border-blue-200 bg-white font-bold outline-none focus:border-blue-600"
              >
                <option value="un">Unidade (un)</option>
                <option value="pct">Pacote (pct)</option>
                <option value="kg">Quilo (kg)</option>
                <option value="cx">Caixa (cx)</option>
                <option value="lt">Litro (lt)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-blue-900 uppercase mb-1">
                Preço de Venda (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-3.5 text-lg rounded-xl border-2 border-blue-200 bg-white font-bold outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-blue-900 uppercase mb-1">
                Preço de Custo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full p-3.5 text-lg rounded-xl border-2 border-blue-200 bg-white font-bold outline-none focus:border-blue-600"
              />
              <p className="text-xs text-blue-800 font-semibold mt-1">Usado para calcular os gastos com reposição.</p>
            </div>

            <div>
              <label className="block text-sm font-black text-blue-900 uppercase mb-1">
                Quantidade Inicial no Estoque
              </label>
              <input
                type="number"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full p-3.5 text-lg rounded-xl border-2 border-blue-200 bg-white font-bold outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-rose-800 uppercase mb-1">
                Estoque Mínimo Seguro
              </label>
              <input
                type="number"
                required
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="Quando atingir, gera alerta"
                className="w-full p-3.5 text-lg rounded-xl border-2 border-rose-300 bg-white font-bold text-rose-700 outline-none focus:border-rose-600"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-sm font-black text-blue-900 uppercase mb-1">
                Código de Barras (opcional)
              </label>
              <input
                type="text"
                inputMode="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Digite o EAN/UPC ou conteúdo do QR Code"
                className="w-full p-3.5 text-lg rounded-xl border-2 border-blue-200 bg-white font-bold outline-none focus:border-blue-600"
              />
              <p className="text-xs text-blue-800 font-semibold mt-1">
                Depois de cadastrar, use o botão “Ler código” na tela de vendas para localizar este produto.
              </p>
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-sm font-black text-emerald-900 uppercase mb-1"><span className="inline-flex items-center gap-1"><Truck className="w-4 h-4" /> Fornecedor para reposição (opcional)</span></label>
              <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="w-full p-3.5 text-lg rounded-xl border-2 border-emerald-200 bg-white font-bold outline-none focus:border-emerald-600">
                <option value="">Sem fornecedor vinculado</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} — {supplier.phone}</option>)}
              </select>
              {suppliers.length === 0 && <p className="text-xs text-emerald-800 font-semibold mt-1">Cadastre fornecedores antes para poder vinculá-los aqui.</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-md"
            >
              Salvar Produto
            </button>
          </div>
        </form>
      )}

      {/* Tabela Limpa e Espaçosa com visual descomplicado */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200 text-slate-700">
                <th className="p-4 text-base font-black uppercase">Produto</th>
                <th className="p-4 text-base font-black uppercase">Categoria</th>
                <th className="p-4 text-base font-black uppercase text-center">Preço</th>
                <th className="p-4 text-base font-black uppercase text-center">Custo</th>
                <th className="p-4 text-base font-black uppercase text-center">Código</th>
                <th className="p-4 text-base font-black uppercase text-center">Estoque Atual</th>
                <th className="p-4 text-base font-black uppercase text-center text-rose-700">Estoque Mínimo</th>
                <th className="p-4 text-base font-black uppercase text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 text-slate-800 text-base font-semibold">
              {groupedProducts.map((group) => (
                <React.Fragment key={group.category}>
                  <tr className="bg-blue-50 border-y-2 border-blue-100">
                    <td colSpan={8} className="px-4 py-3 text-lg font-black text-blue-950">
                      {group.category} <span className="text-sm font-bold text-blue-700">({group.products.length} {group.products.length === 1 ? 'produto' : 'produtos'})</span>
                    </td>
                  </tr>
                  {group.products.map((p) => {
                    const isEditing = editingId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    {/* Nome */}
                    <td className="p-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="p-2 border-2 border-blue-400 rounded-lg font-bold w-full"
                        />
                      ) : (
                        <div>
                          <p className="text-lg font-black text-slate-900">{p.name}</p>
                          <span className="text-xs text-emerald-700 font-bold">{p.supplierName ? `Fornecedor: ${p.supplierName}` : 'Sem fornecedor vinculado'}</span>
                          <span className="text-xs text-slate-400 font-normal">
                            Última saída: {p.lastMovementDate.split('-').reverse().join('/')}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Categoria */}
                    <td className="p-4">
                      {isEditing ? (
                        <div className="space-y-2"><input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="p-2 border-2 border-blue-400 rounded-lg font-bold" /><select value={editSupplierId} onChange={(e) => setEditSupplierId(e.target.value)} className="p-2 border-2 border-emerald-300 rounded-lg font-bold text-sm"><option value="">Sem fornecedor</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></div>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold text-sm">
                          {p.category}
                        </span>
                      )}
                    </td>

                    {/* Preço */}
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="p-2 border-2 border-blue-400 rounded-lg font-bold w-24 text-center"
                        />
                      ) : (
                        `R$ ${p.price.toFixed(2).replace('.', ',')}`
                      )}
                    </td>

                    {/* Custo */}
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editCostPrice}
                          onChange={(e) => setEditCostPrice(e.target.value)}
                          className="p-2 border-2 border-blue-400 rounded-lg font-bold w-24 text-center"
                        />
                      ) : (
                        `R$ ${(p.costPrice ?? p.price * 0.7).toFixed(2).replace('.', ',')}`
                      )}
                    </td>

                    {/* Código */}
                    <td className="p-4 text-center">
                      <span className="text-sm font-bold text-slate-500 font-mono">
                        {p.barcode || 'Não cadastrado'}
                      </span>
                    </td>

                    {/* Estoque Atual */}
                    <td className="p-4 text-center">
                      <span className="text-xl font-black text-slate-900">
                        {p.currentStock} {p.unit}
                      </span>
                    </td>

                    {/* Estoque Mínimo */}
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editMinStock}
                          onChange={(e) => setEditMinStock(e.target.value)}
                          className="p-2 border-2 border-rose-400 rounded-lg font-black text-rose-700 w-20 text-center"
                        />
                      ) : (
                        <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-xl font-black text-lg">
                          {p.minStock} {p.unit}
                        </span>
                      )}
                    </td>

                    {/* Botões de Ação */}
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(p)}
                            className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                            title="Salvar alterações"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300"
                            title="Cancelar edição"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(p)}
                            className="p-2.5 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded-xl transition-colors"
                            title="Alterar produto"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          {canDelete && <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja apagar o produto "${p.name}"?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="p-2.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-xl transition-colors"
                              title="Remover produto"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>}
                        </div>
                      )}
                    </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
