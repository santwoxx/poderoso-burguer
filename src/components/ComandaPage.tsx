import React, { useMemo, useState } from 'react';
import { Printer, MessageSquare, Phone, Copy, Check, ArrowLeft, AlertTriangle } from 'lucide-react';
import type { Comanda } from '../utils/orderCode';
import {
  PAYMENT_LABELS,
  REPLY_TEMPLATES,
  buildComandaPlainText,
  formatBRL,
  formatPhoneForWhatsapp,
  generateCustomerReplyWhatsAppLink,
  type ReplyKind,
} from '../utils/whatsapp';
import { STORE_INFO } from '../data/mockData';

interface ComandaPageProps {
  comanda: Comanda | null;
}

const REPLY_ORDER: ReplyKind[] = ['CONFIRMED', 'READY', 'DELIVERY', 'CANCELED'];

const Divider = () => <div className="border-t border-dashed border-zinc-400 my-2" />;

export const ComandaPage: React.FC<ComandaPageProps> = ({ comanda }) => {
  const [copied, setCopied] = useState(false);

  const createdLabel = useMemo(
    () => (comanda ? new Date(comanda.createdAt).toLocaleString('pt-BR') : ''),
    [comanda]
  );

  const backToMenu = () => {
    window.location.href = window.location.pathname;
  };

  if (!comanda) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-[#141418] border border-zinc-800 rounded-3xl p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto" />
          <h1 className="font-black text-white text-lg font-display">Comanda não encontrada</h1>
          <p className="text-zinc-400 text-xs leading-relaxed">
            O link da comanda parece incompleto. Peça ao cliente para reenviar o pedido pelo WhatsApp —
            o link vai inteiro na mensagem, sem quebras de linha.
          </p>
          <button
            onClick={backToMenu}
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-3 rounded-xl text-xs"
          >
            Ir para o cardápio
          </button>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildComandaPlainText(comanda));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Papel 80mm só enquanto a comanda estiver na tela */}
      <style>{'@media print { @page { size: 80mm auto; margin: 3mm; } }'}</style>

      <header className="no-print sticky top-0 z-20 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between gap-3">
        <button
          onClick={backToMenu}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Cardápio
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-full">
          Comanda do balcão
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* ————— Papel da comanda ————— */}
        <div className="print-area comanda-paper bg-white text-zinc-900 rounded-2xl p-5 shadow-2xl mx-auto w-full">
          <div className="text-center space-y-0.5">
            <h1 className="font-black text-lg uppercase tracking-tight">{STORE_INFO.name}</h1>
            <p className="text-[11px] uppercase font-bold tracking-widest">Comanda de Pedido</p>
            <p className="text-[11px]">{STORE_INFO.whatsappFormatted}</p>
          </div>

          <Divider />

          <div className="flex items-baseline justify-between">
            <span className="font-black text-base">{comanda.displayId}</span>
            <span className="text-[11px]">{createdLabel}</span>
          </div>

          <Divider />

          <div className="space-y-0.5">
            <p className="text-[11px] font-black uppercase tracking-wider">Cliente</p>
            <p className="text-sm font-bold">{comanda.customerName}</p>
            <p className="text-xs">{comanda.customerPhone}</p>
          </div>

          <Divider />

          <div className="space-y-0.5">
            <p className="text-[11px] font-black uppercase tracking-wider">Entrega</p>
            <p className="text-sm font-bold">
              {comanda.address.street}, Nº {comanda.address.number}
            </p>
            <p className="text-xs">Bairro: {comanda.address.neighborhood}</p>
            {comanda.address.complement && <p className="text-xs">Comp: {comanda.address.complement}</p>}
            {comanda.address.reference && <p className="text-xs">Ref: {comanda.address.reference}</p>}
          </div>

          <Divider />

          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider">Itens</p>
            {comanda.items.map((item, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between gap-2 font-bold">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-num whitespace-nowrap">{formatBRL(item.totalPrice)}</span>
                </div>
                {item.meatPoint && <p className="pl-3">Ponto: {item.meatPoint}</p>}
                {item.combo && (
                  <div className="pl-3">
                    <p>1) {item.combo.burger1}</p>
                    <p>2) {item.combo.burger2}</p>
                    <p>Acomp: {item.combo.side}</p>
                  </div>
                )}
                {item.addons?.map((addon, i) => (
                  <p key={i} className="pl-3">
                    + {addon.name} ({formatBRL(addon.price)})
                  </p>
                ))}
                {item.observation && <p className="pl-3 font-bold">OBS: {item.observation}</p>}
              </div>
            ))}
          </div>

          <Divider />

          <div className="text-xs space-y-0.5 font-num">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatBRL(comanda.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa de entrega</span>
              <span>{formatBRL(comanda.deliveryFee)}</span>
            </div>
            {comanda.discount > 0 && (
              <div className="flex justify-between">
                <span>Desconto{comanda.couponCode ? ` (${comanda.couponCode})` : ''}</span>
                <span>-{formatBRL(comanda.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black pt-1">
              <span>TOTAL</span>
              <span>{formatBRL(comanda.total)}</span>
            </div>
          </div>

          <Divider />

          <div className="text-xs space-y-0.5">
            <p className="font-black uppercase">Pagamento: {PAYMENT_LABELS[comanda.paymentMethod]}</p>
            {comanda.paymentMethod === 'CASH' && (
              <p>{comanda.changeFor ? `Levar troco para R$ ${comanda.changeFor}` : 'Sem troco'}</p>
            )}
            {comanda.paymentMethod === 'PIX' && STORE_INFO.pixKey && <p>Chave Pix: {STORE_INFO.pixKey}</p>}
          </div>

          <Divider />

          <p className="text-center text-[11px] font-bold">Obrigado pela preferência! 🍔</p>
        </div>

        {/* ————— Ações do balcão ————— */}
        <div className="no-print space-y-3">
          <button
            onClick={() => window.print()}
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir comanda
          </button>

          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-2">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Responder o cliente no WhatsApp
            </p>
            <div className="grid grid-cols-2 gap-2">
              {REPLY_ORDER.map((kind) => (
                <a
                  key={kind}
                  href={generateCustomerReplyWhatsAppLink(comanda, kind)}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-colors ${
                    kind === 'CANCELED'
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/40'
                      : 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/25'
                  }`}
                >
                  <span>{REPLY_TEMPLATES[kind].icon}</span>
                  {REPLY_TEMPLATES[kind].label}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:+${formatPhoneForWhatsapp(comanda.customerPhone)}`}
              className="flex items-center justify-center gap-1.5 bg-[#141418] border border-zinc-800 text-zinc-300 hover:text-white px-3 py-2.5 rounded-xl text-[11px] font-bold"
            >
              <Phone className="w-3.5 h-3.5" />
              Ligar para o cliente
            </a>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 bg-[#141418] border border-zinc-800 text-zinc-300 hover:text-white px-3 py-2.5 rounded-xl text-[11px] font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar resumo'}
            </button>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed flex gap-2">
            <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Este link carrega o pedido inteiro dentro dele — funciona offline depois de aberto e pode ser
              reimpresso quantas vezes precisar.
            </span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ComandaPage;
