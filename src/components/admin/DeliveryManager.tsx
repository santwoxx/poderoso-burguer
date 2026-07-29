import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Check, X, Clock } from 'lucide-react';
import type { Neighborhood } from '../../types';

interface DeliveryManagerProps {
  neighborhoods: Neighborhood[];
  onSaveNeighborhoods: (neighborhoods: Neighborhood[]) => void;
}

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({
  neighborhoods,
  onSaveNeighborhoods,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [feeInput, setFeeInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  const [isCreating, setIsCreating] = useState(false);

  const handleStartCreate = () => {
    setNameInput('');
    setFeeInput('5.00');
    setTimeInput('30-40 min');
    setIsCreating(true);
  };

  const handleSaveNew = () => {
    if (!nameInput.trim()) {
      alert('Informe o nome do bairro.');
      return;
    }
    const fee = parseFloat(feeInput.replace(',', '.')) || 0;
    const newNeighborhood: Neighborhood = {
      id: Date.now().toString(),
      name: nameInput.trim(),
      deliveryFee: fee,
      estimatedTime: timeInput.trim() || '30-40 min',
      isActive: true,
    };
    onSaveNeighborhoods([...neighborhoods, newNeighborhood]);
    setIsCreating(false);
  };

  const handleStartEdit = (item: Neighborhood) => {
    setEditingId(item.id);
    setNameInput(item.name);
    setFeeInput(item.deliveryFee.toFixed(2));
    setTimeInput(item.estimatedTime);
  };

  const handleSaveEdit = (id: string) => {
    const fee = parseFloat(feeInput.replace(',', '.')) || 0;
    const updated = neighborhoods.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          name: nameInput.trim(),
          deliveryFee: fee,
          estimatedTime: timeInput.trim(),
        };
      }
      return n;
    });
    onSaveNeighborhoods(updated);
    setEditingId(null);
  };

  const handleToggleActive = (id: string) => {
    const updated = neighborhoods.map((n) => (n.id === id ? { ...n, isActive: !n.isActive } : n));
    onSaveNeighborhoods(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este bairro?')) {
      onSaveNeighborhoods(neighborhoods.filter((n) => n.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141418] border border-zinc-800 rounded-2xl p-5">
        <div>
          <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Configuração de Frete por Bairro
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            Defina o valor da taxa de entrega e o tempo estimado para cada bairro atendido.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Novo Bairro</span>
        </button>
      </div>

      {isCreating && (
        <div className="bg-[#18181d] border border-orange-500/50 rounded-2xl p-5 space-y-4 animate-fade-in">
          <h4 className="font-bold text-white text-sm">Adicionar Novo Bairro</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-400 font-semibold mb-1 block">Nome do Bairro</label>
              <input
                type="text"
                placeholder="Ex: Jardim Bahia"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-semibold mb-1 block">Taxa (R$)</label>
              <input
                type="text"
                placeholder="Ex: 7.50"
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-semibold mb-1 block">Tempo Estimado</label>
              <input
                type="text"
                placeholder="Ex: 30-40 min"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveNew}
              className="bg-orange-500 hover:bg-orange-400 text-black px-4 py-2 rounded-xl text-xs font-black"
            >
              Salvar Bairro
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {neighborhoods.map((item) => {
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id}
              className={`bg-[#141418] border rounded-2xl p-5 space-y-3 transition-all ${
                item.isActive ? 'border-zinc-800' : 'border-red-900/40 opacity-60'
              }`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white p-2 rounded-xl text-xs font-bold"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={feeInput}
                      onChange={(e) => setFeeInput(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 text-orange-400 p-2 rounded-xl text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 text-zinc-300 p-2 rounded-xl text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      className="p-1.5 bg-emerald-500 text-black font-bold rounded-lg text-xs flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-white text-base">{item.name}</h4>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        <span>Prazo: {item.estimatedTime}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                        item.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {item.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="bg-[#18181d] border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Taxa de Entrega:</span>
                    <span className="text-base font-black text-orange-400">
                      {item.deliveryFee === 0
                        ? 'GRÁTIS'
                        : `R$ ${item.deliveryFee.toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className="text-zinc-400 hover:text-white font-medium"
                    >
                      {item.isActive ? 'Desativar' : 'Ativar'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-zinc-900 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
