import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Clock, Bike, Sparkles, AlertCircle, MessageSquare } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Order } from '../types';
import { STATUS_LABELS, generateCustomerOrderWhatsAppLink } from '../utils/whatsapp';

interface OrderTrackerModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  order: initialOrder,
  onClose,
}) => {
  if (!initialOrder) return null;

  const [currentOrder, setCurrentOrder] = useState<Order>(initialOrder);
  const [statusChangedAlert, setStatusChangedAlert] = useState(false);

  useEffect(() => {
    setCurrentOrder(initialOrder);
    const docId = initialOrder.id.replace('#', '').replace('-', '_');
    const orderRef = doc(db, 'orders', docId);

    const unsub = onSnapshot(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        const updated = snapshot.data() as Order;
        if (updated.status !== currentOrder.status) {
          setStatusChangedAlert(true);
          setTimeout(() => setStatusChangedAlert(false), 4000);
        }
        setCurrentOrder(updated);
      }
    });

    return () => unsub();
  }, [initialOrder.id]);

  const currentStatusInfo = STATUS_LABELS[currentOrder.status];

  const steps = [
    { key: 'ANALYSIS', label: 'Em Análise', icon: Clock, desc: 'Aguardando confirmação do restaurante' },
    { key: 'CONFIRMED', label: 'Confirmado', icon: CheckCircle2, desc: 'Pedido aceito e em preparo' },
    { key: 'DELIVERY', label: 'Saiu para Entrega', icon: Bike, desc: 'Entregador a caminho do seu endereço' },
    { key: 'COMPLETED', label: 'Concluído', icon: Sparkles, desc: 'Pedido entregue com sucesso!' },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'ANALYSIS': return 0;
      case 'CONFIRMED': return 1;
      case 'DELIVERY': return 2;
      case 'COMPLETED': return 3;
      default: return -1;
    }
  };

  const activeIndex = getStepIndex(currentOrder.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-backdrop overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#141418] border border-orange-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 my-auto animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {statusChangedAlert && (
          <div className="bg-orange-500 text-black p-3 rounded-2xl font-black text-xs text-center animate-bounce shadow-xl">
            🔥 STATUS ATUALIZADO EM TEMPO REAL PELO RESTAURANTE!
          </div>
        )}

        <div className="text-center space-y-2">
          <span className="bg-orange-500/20 text-orange-400 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-orange-500/30">
            Acompanhamento ao Vivo
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display">
            Pedido {currentOrder.id}
          </h2>
          <p className="text-zinc-400 text-xs font-medium">
            Atualização em tempo real do seu pedido
          </p>
        </div>

        <div className="bg-[#18181d] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-base ${currentStatusInfo.color}`}>
              {currentStatusInfo.icon}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400">Status Atual</span>
              <h4 className="text-sm font-extrabold text-white">{currentStatusInfo.label}</h4>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block font-semibold">Valor Total</span>
            <span className="text-sm font-black text-orange-400 font-num">
              R$ {currentOrder.total.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {currentOrder.status === 'CANCELED' ? (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h4 className="font-extrabold text-red-400 text-sm">Pedido Cancelado</h4>
            <p className="text-zinc-400 text-xs">
              Este pedido foi cancelado pelo estabelecimento. Em caso de dúvidas, entre em contato pelo WhatsApp.
            </p>
          </div>
        ) : (
          <div className="space-y-4 relative pt-2">
            {steps.map((step, idx) => {
              const isDone = activeIndex > idx;
              const isCurrent = activeIndex === idx;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex gap-4 items-start relative z-10">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isCurrent
                        ? 'bg-orange-500 text-black border-orange-400 shadow-lg shadow-orange-500/30 scale-110'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <h5
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-orange-400 text-sm' : isDone ? 'text-white' : 'text-zinc-500'
                      }`}
                    >
                      {step.label}
                    </h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-[#18181d] border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs text-zinc-300">
          <div className="flex justify-between font-bold border-b border-zinc-800 pb-2">
            <span>Endereço de Entrega</span>
            <span className="text-orange-400">{currentOrder.address.neighborhood}</span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            {currentOrder.address.street}, Nº {currentOrder.address.number}
          </p>
        </div>

        <button
          onClick={() => {
            const link = generateCustomerOrderWhatsAppLink(currentOrder);
            window.open(link, '_blank');
          }}
          className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Falar com Atendimento no WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
