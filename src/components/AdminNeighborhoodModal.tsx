import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Neighborhood } from '../types';

interface AdminNeighborhoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (neighborhood: Neighborhood) => void;
  neighborhood: Neighborhood | null;
}

export const AdminNeighborhoodModal: React.FC<AdminNeighborhoodModalProps> = ({
  isOpen,
  onClose,
  onSave,
  neighborhood,
}) => {
  const [name, setName] = useState(neighborhood?.name || '');
  const [deliveryFee, setDeliveryFee] = useState(neighborhood ? String(neighborhood.deliveryFee) : '0');
  const [estimatedTime, setEstimatedTime] = useState(neighborhood?.estimatedTime || '30-40 min');
  const [isActive, setIsActive] = useState(neighborhood?.isActive ?? true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Preencha o nome do bairro.');
      return;
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newNeighborhood: Neighborhood = {
      id: neighborhood?.id || `nb-${slug}-${Date.now()}`,
      name: name.trim(),
      deliveryFee: Number(deliveryFee) || 0,
      estimatedTime: estimatedTime.trim(),
      isActive,
    };

    onSave(newNeighborhood);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm bg-[#141418] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-black text-white text-lg font-display">
          {neighborhood ? 'Editar Bairro' : 'Novo Bairro'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1">Nome do Bairro *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">Taxa de Entrega (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">Tempo Estimado</label>
              <input
                type="text"
                placeholder="30-40 min"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-zinc-300">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Ativo (aparece para o cliente)
          </label>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-3 rounded-xl shadow-lg shadow-orange-500/20 text-xs uppercase tracking-wider transition-all mt-2"
          >
            Salvar Bairro
          </button>
        </form>
      </div>
    </div>
  );
};
