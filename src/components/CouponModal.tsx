import React from 'react';
import { X, Ticket, Copy, Check } from 'lucide-react';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CouponModal: React.FC<CouponModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('PODEROSO10');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#141418] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/30">
          <Ticket className="w-8 h-8" />
        </div>

        <div>
          <h3 className="font-extrabold text-white text-lg">Cupom de Boas-Vindas!</h3>
          <p className="text-zinc-400 text-xs mt-1">
            Ganhe <span className="text-orange-400 font-bold">10% DE DESCONTO</span> no subtotal do seu pedido.
          </p>
        </div>

        <div className="bg-[#18181d] border border-dashed border-orange-500/50 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Código do Cupom</span>
            <span className="text-lg font-black text-orange-400 tracking-wider">PODEROSO10</span>
          </div>

          <button
            onClick={handleCopy}
            className="bg-orange-500 hover:bg-orange-400 text-black p-2.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1"
          >
            {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
