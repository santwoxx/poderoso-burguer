import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface FloatingCartBarProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
}) => {
  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-24 z-40 animate-fade-in">
      <button
        onClick={onOpenCart}
        className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-extrabold px-5 py-3.5 rounded-2xl shadow-2xl shadow-orange-600/40 border border-orange-400/40 flex items-center justify-between gap-4 backdrop-blur-md transition-all transform hover:scale-105 active:scale-95"
      >
        <div className="flex items-center gap-3">
          <div className="relative bg-black/30 p-2 rounded-xl">
            <ShoppingBag className="w-5 h-5 text-white" />
            <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 font-black text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow font-num">
              {cartCount}
            </span>
          </div>
          <div className="text-left font-num">
            <span className="text-[10px] text-orange-100 uppercase tracking-wider block font-semibold">
              {cartCount === 1 ? '1 item no carrinho' : `${cartCount} itens no carrinho`}
            </span>
            <span className="text-base font-black">
              R$ {cartTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs uppercase tracking-wider font-extrabold bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
          <span>Ver Carrinho</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
};
