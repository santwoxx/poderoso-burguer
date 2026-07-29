import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import type { Product, Category } from '../../types';

interface ProductsManagerProps {
  products: Product[];
  categories: Category[];
  onSaveProducts: (products: Product[]) => void;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products,
  categories,
  onSaveProducts,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'burgers-artesanais');
  const [image, setImage] = useState('');
  const [requiresMeatPoint, setRequiresMeatPoint] = useState(true);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setCategory(categories[0]?.id || 'burgers-artesanais');
    setImage('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80');
    setRequiresMeatPoint(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setPrice(p.price.toString());
    setOriginalPrice(p.originalPrice ? p.originalPrice.toString() : '');
    setCategory(p.category);
    setImage(p.image);
    setRequiresMeatPoint(!!p.requiresMeatPoint);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) {
      alert('Preencha o nome e o preço do produto.');
      return;
    }

    const numPrice = parseFloat(price.replace(',', '.')) || 0;
    const numOrigPrice = originalPrice ? parseFloat(originalPrice.replace(',', '.')) : undefined;

    if (editingProduct) {
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: name.trim(),
              description: description.trim(),
              price: numPrice,
              originalPrice: numOrigPrice,
              category,
              image: image.trim() || p.image,
              requiresMeatPoint,
            }
          : p
      );
      onSaveProducts(updated);
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        originalPrice: numOrigPrice,
        category,
        image: image.trim() || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        requiresMeatPoint,
      };
      onSaveProducts([newProd, ...products]);
    }

    setModalOpen(false);
  };

  const handleToggleAvailable = (id: string) => {
    const updated = products.map((p) => (p.id === id ? { ...p, isAvailable: !p.isAvailable } : p));
    onSaveProducts(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este produto do cardápio?')) {
      onSaveProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141418] border border-zinc-800 rounded-2xl p-5">
        <div>
          <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Gestão do Cardápio
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            Cadastre novos hambúrgueres, altere preços e pausing itens sem estoque.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Produto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className={`bg-[#141418] border rounded-2xl p-4 space-y-3 transition-all flex flex-col justify-between ${
              product.isAvailable ? 'border-zinc-800' : 'border-red-900/40 opacity-60'
            }`}
          >
            <div className="flex gap-3">
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-20 rounded-xl object-cover bg-zinc-900 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-white text-sm truncate">{product.name}</h4>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                      product.isAvailable
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    {product.isAvailable ? 'Ativo' : 'Pausado'}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs line-clamp-2 mt-1">{product.description}</p>
                <div className="mt-2 font-black text-orange-400 text-sm">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
              <button
                onClick={() => handleToggleAvailable(product.id)}
                className="text-zinc-400 hover:text-white flex items-center gap-1 font-medium"
              >
                {product.isAvailable ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Pausar Estoque</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ativar Produto</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 bg-zinc-900 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSave}
            className="relative w-full max-w-lg bg-[#141418] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Nome do Produto</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Preço Atual (R$)</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="19.90"
                    className="w-full bg-zinc-900 border border-zinc-800 text-orange-400 font-bold p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Preço Antigo (R$)</label>
                  <input
                    type="text"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Opcional"
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">URL da Foto</label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={requiresMeatPoint}
                  onChange={(e) => setRequiresMeatPoint(e.target.checked)}
                  className="rounded accent-orange-500 w-4 h-4"
                />
                <span>Exige escolha do ponto da carne (Hambúrgueres)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-400 text-black px-5 py-2.5 rounded-xl text-xs font-black"
              >
                Salvar Produto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
