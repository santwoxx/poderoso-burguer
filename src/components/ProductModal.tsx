import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Check } from 'lucide-react';
import type { Product, ProductAddon, CartItemOption } from '../types';

interface ProductModalProps {
  product: Product | null;
  products?: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, options: CartItemOption) => void;
}

const MEAT_POINTS = ['Mal passada (Suculenta)', 'Ao ponto (Recomendado 🔥)', 'Bem passada'];

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  products = [],
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedMeatPoint, setSelectedMeatPoint] = useState<string>(
    product?.requiresMeatPoint ? MEAT_POINTS[1] : ''
  );
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [observation, setObservation] = useState('');

  const [comboBurger1, setComboBurger1] = useState('');
  const [comboBurger2, setComboBurger2] = useState('');
  const [comboSide, setComboSide] = useState('');

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setSelectedMeatPoint(product.requiresMeatPoint ? MEAT_POINTS[1] : '');
    setSelectedAddons([]);
    setObservation('');
    setComboBurger1('');
    setComboBurger2('');
    setComboSide('');
  }, [product]);

  if (!product) return null;

  const availableBurgers = products.filter(p => p.category === 'burgers-artesanais');
  const COMBO_SIDES = ['Anéis de Cebola Crocantes', 'Batata Frita Sequinha', 'Batata Frita com Cheddar e Bacon'];

  const toggleAddon = (addon: ProductAddon) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = product.price + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    if (product.requiresMeatPoint && !selectedMeatPoint) {
      alert('Por favor, escolha o ponto da carne.');
      return;
    }
    
    if (product.isCustomCombo) {
      if (!comboBurger1 || !comboBurger2) {
        alert('Por favor, selecione os dois hambúrgueres do combo.');
        return;
      }
      if (!comboSide) {
        alert('Por favor, selecione o acompanhamento do combo.');
        return;
      }
    }

    onAddToCart(product, quantity, {
      meatPoint: selectedMeatPoint,
      addons: selectedAddons,
      observation,
      comboSelections: product.isCustomCombo ? {
        burger1: comboBurger1,
        burger2: comboBurger2,
        side: comboSide,
      } : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-backdrop overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#141418] border border-orange-500/30 rounded-3xl overflow-hidden shadow-2xl my-auto animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/70 hover:bg-black text-[#fff] p-2 rounded-full backdrop-blur-md transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-zinc-900">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-transparent" />
        </div>

        <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">{product.name}</h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 leading-relaxed">
              {product.description}
            </p>
          </div>

          {product.requiresMeatPoint && (
            <div className="bg-[#1a1a20] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Qual o ponto da carne?
                </span>
                <span className="text-[10px] font-bold bg-orange-600/30 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                  Obrigatório
                </span>
              </div>

              <div className="space-y-2">
                {MEAT_POINTS.map((point) => {
                  const isSelected = selectedMeatPoint === point;
                  return (
                    <label
                      key={point}
                      onClick={() => setSelectedMeatPoint(point)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500 text-orange-400 scale-[1.01]'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span>{point}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-orange-500 bg-orange-500' : 'border-zinc-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {product.isCustomCombo && (
            <div className="bg-[#1a1a20] border border-zinc-800/80 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Monte seu Combo
                </span>
                <span className="text-[10px] font-bold bg-orange-600/30 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                  Obrigatório
                </span>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 block">1º Hambúrguer</label>
                  <select
                    value={comboBurger1}
                    onChange={(e) => setComboBurger1(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">-- Selecione o 1º Lanche --</option>
                    {availableBurgers.map(b => (
                      <option key={`b1-${b.id}`} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 block">2º Hambúrguer</label>
                  <select
                    value={comboBurger2}
                    onChange={(e) => setComboBurger2(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">-- Selecione o 2º Lanche --</option>
                    {availableBurgers.map(b => (
                      <option key={`b2-${b.id}`} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 block">Acompanhamento</label>
                  <select
                    value={comboSide}
                    onChange={(e) => setComboSide(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">-- Selecione o Acompanhamento --</option>
                    {COMBO_SIDES.map(side => (
                      <option key={side} value={side}>{side}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {product.availableAddons && product.availableAddons.length > 0 && (
            <div className="bg-[#1a1a20] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Turbine seu pedido (Adicionais)
                </span>
                <span className="text-[10px] font-medium text-zinc-400">Opcional</span>
              </div>

              <div className="space-y-2">
                {product.availableAddons.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-orange-500/10 border-orange-500 text-white font-semibold scale-[1.01]'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-orange-500 border-orange-500' : 'border-zinc-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-black stroke-[3]" />}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="text-orange-400 font-bold font-num">
                        +R$ {addon.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 block">
              Observações (Ex: Tirar cebola, maionese à parte)
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Digite aqui como prefere seu lanche..."
              rows={2}
              className="w-full bg-[#1a1a20] border border-zinc-800 text-zinc-200 placeholder-zinc-500 p-3 rounded-xl text-xs focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-[#18181d] border-t border-zinc-800 flex items-center gap-3">
          <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-xl p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors active:scale-90"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-black text-sm text-white font-num">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-2 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors active:scale-90"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <span>ADICIONAR</span>
            <span className="font-num">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
