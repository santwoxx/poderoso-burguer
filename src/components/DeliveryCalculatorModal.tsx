import React, { useState } from 'react';
import { X, MapPin, Search, Clock } from 'lucide-react';
import type { Neighborhood } from '../types';

interface DeliveryCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  neighborhoods: Neighborhood[];
  selectedNeighborhood: Neighborhood | null;
  onSelectNeighborhood: (n: Neighborhood) => void;
}

export const DeliveryCalculatorModal: React.FC<DeliveryCalculatorModalProps> = ({
  isOpen,
  onClose,
  neighborhoods,
  selectedNeighborhood,
  onSelectNeighborhood,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = neighborhoods.filter(
    (n) => n.isActive && n.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#141418] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            <h2 className="font-extrabold text-white text-base">Taxa e Tempo de Entrega</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Digite o seu bairro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 pl-9 pr-3 py-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <p className="text-center text-zinc-500 text-xs py-6">
              Nenhum bairro encontrado para "{search}".
            </p>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedNeighborhood?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectNeighborhood(item);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-orange-500/10 border-orange-500 text-white font-bold'
                      : 'bg-[#18181d] border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.name}</h4>
                    <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-orange-400" />
                      <span>{item.estimatedTime}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-orange-400 block">
                      {item.deliveryFee === 0
                        ? 'GRÁTIS'
                        : `R$ ${item.deliveryFee.toFixed(2).replace('.', ',')}`}
                    </span>
                    <span className="text-[10px] text-zinc-500 underline">Selecionar</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
