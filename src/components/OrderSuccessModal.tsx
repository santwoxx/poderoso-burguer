import React from 'react';
import { X, CheckCircle2, MessageSquare, Printer, AlertTriangle } from 'lucide-react';
import { formatBRL } from '../utils/whatsapp';
import { STORE_INFO } from '../data/mockData';

export interface SentOrder {
  displayId: string;
  total: number;
  customerName: string;
  whatsappUrl: string;
  comandaUrl: string;
  blocked: boolean;
}

interface OrderSuccessModalProps {
  sentOrder: SentOrder | null;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ sentOrder, onClose }) => {
  if (!sentOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-backdrop overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#141418] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-5 my-auto animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-white font-display">
            {sentOrder.blocked ? 'Falta só enviar!' : 'Pedido enviado!'}
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed px-2">
            {sentOrder.blocked ? (
              <>Abrimos o WhatsApp da loja, mas o navegador bloqueou a janela. Toque no botão abaixo para enviar.</>
            ) : (
              <>
                Seu pedido <span className="text-white font-bold">{sentOrder.displayId}</span> foi para o
                WhatsApp do {STORE_INFO.name}. <span className="text-white font-bold">Envie a mensagem</span> na
                conversa que abriu — a confirmação vem por lá mesmo.
              </>
            )}
          </p>
        </div>

        <div className="bg-[#18181d] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Pedido</span>
            <span className="text-sm font-black text-white">{sentOrder.displayId}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total</span>
            <span className="text-sm font-black text-orange-400 font-num">{formatBRL(sentOrder.total)}</span>
          </div>
        </div>

        {sentOrder.blocked && (
          <div className="flex gap-2 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-3 text-[11px] text-orange-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Se nada abrir, libere os pop-ups deste site no navegador e toque novamente.</span>
          </div>
        )}

        <div className="space-y-2">
          <a
            href={sentOrder.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            {sentOrder.blocked ? 'Enviar pedido no WhatsApp' : 'Reabrir conversa no WhatsApp'}
          </a>

          <a
            href={sentOrder.comandaUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-[#18181d] hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Ver comanda do pedido
          </a>
        </div>

        <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
          O mesmo link da comanda foi enviado na mensagem — é por ele que a loja imprime seu pedido.
        </p>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
