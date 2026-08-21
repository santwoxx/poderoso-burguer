import React, { useState } from 'react';
import { Plus, Sparkles, Check } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  cartCountForProduct?: number;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cartCountForProduct = 0,
  onSelect,
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  const handleClick = () => {
    if (!product.isAvailable) return;
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
    onSelect(product);
  };

  // Correção de emergência para a imagem da Coca-Cola 1L que está vindo do Firebase como Schweppes
  const imageUrl = product.id === 'prod-coca-1l' 
    ? '/coca-1l.png'
    : product.image;

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-[#141418] hover:bg-[#19191e] border border-zinc-800/80 hover:border-orange-500/50 rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 transition-all duration-300 cursor-pointer shadow-md hover:shadow-2xl hover:shadow-orange-500/10 transform hover:-translate-y-1 active:scale-95 ${
        isClicked ? 'scale-95 ring-2 ring-orange-500' : ''
      } ${!product.isAvailable ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''}`}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur opacity-0 group-hover:opacity-15 transition duration-300 pointer-events-none" />

      {/* Product Image */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-zinc-900 shadow-inner">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        {hasDiscount && (
          <span className="absolute top-1.5 left-1.5 bg-orange-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 font-num">
            <Sparkles className="w-2.5 h-2.5 fill-current" />
            OFERTA
          </span>
        )}
        {cartCountForProduct > 0 && (
          <span className="absolute bottom-1.5 right-1.5 bg-emerald-500 text-black font-black text-[10px] px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 font-num border border-black/20">
            <Check className="w-3 h-3 stroke-[3]" />
            {cartCountForProduct} no carrinho
          </span>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[1px] flex items-center justify-center text-center p-1">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Esgotado</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0 z-10">
        <div>
          <h3 className="font-extrabold text-white text-sm sm:text-base group-hover:text-orange-400 transition-colors line-clamp-1 font-display tracking-tight">
            {product.name}
          </h3>
          <p className="text-zinc-400 text-xs mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/60">
          <div className="flex items-baseline gap-2 font-num">
            <span className="text-orange-400 font-black text-base sm:text-lg">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
            {hasDiscount && (
              <span className="text-zinc-500 line-through text-xs font-semibold">
                R$ {product.originalPrice?.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          <button
            disabled={!product.isAvailable}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white p-2.5 rounded-xl transition-all font-bold flex items-center justify-center shadow-lg shadow-orange-600/30 group-hover:scale-110 active:scale-90 disabled:bg-zinc-800 disabled:text-zinc-600"
            title="Adicionar ao carrinho"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
