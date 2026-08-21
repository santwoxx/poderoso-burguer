import type { Order } from '../types';
import { STORE_INFO } from '../data/mockData';
import { buildComandaUrl, orderToComanda, type Comanda } from './orderCode';

export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function formatPhoneForWhatsapp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  return `55${digits}`;
}

export const PAYMENT_LABELS: Record<Comanda['paymentMethod'], string> = {
  PIX: 'Pix ⚡',
  CARD: 'Cartão 💳',
  CASH: 'Dinheiro 💵',
};

function itemLines(comanda: Comanda, bullet: (index: number) => string): string {
  return comanda.items
    .map((item, index) => {
      let block = `${bullet(index)} *${item.quantity}x ${item.name}* — ${formatBRL(item.totalPrice)}\n`;
      if (item.meatPoint) block += `   🥩 Ponto: _${item.meatPoint}_\n`;
      if (item.combo) {
        block += `   🍔 ${item.combo.burger1}\n`;
        block += `   🍔 ${item.combo.burger2}\n`;
        block += `   🍟 ${item.combo.side}\n`;
      }
      item.addons?.forEach((addon) => {
        block += `   ➕ ${addon.name} (+${formatBRL(addon.price)})\n`;
      });
      if (item.observation) block += `   📝 Obs: _${item.observation}_\n`;
      return block;
    })
    .join('');
}

/**
 * Mensagem que o cliente envia para o WhatsApp da loja. É o pedido inteiro em texto
 * (legível direto na conversa) + o link da comanda imprimível para o balcão.
 */
export function buildStoreOrderMessage(comanda: Comanda, comandaUrl: string): string {
  let msg = `🍔 *NOVO PEDIDO ${comanda.displayId}*\n`;
  msg += `_${STORE_INFO.name}_\n\n`;

  msg += `👤 *Cliente:* ${comanda.customerName}\n`;
  msg += `📞 *Telefone:* ${comanda.customerPhone}\n\n`;

  msg += `📍 *ENTREGA*\n`;
  msg += `Bairro: *${comanda.address.neighborhood}*\n`;
  msg += `${comanda.address.street}, Nº ${comanda.address.number}\n`;
  if (comanda.address.complement) msg += `Comp: ${comanda.address.complement}\n`;
  if (comanda.address.reference) msg += `Ref: ${comanda.address.reference}\n`;
  msg += `\n`;

  msg += `🛒 *ITENS*\n`;
  msg += itemLines(comanda, (i) => `${i + 1})`);

  msg += `\n💵 *VALORES*\n`;
  msg += `Subtotal: ${formatBRL(comanda.subtotal)}\n`;
  msg += `Entrega: ${formatBRL(comanda.deliveryFee)}\n`;
  if (comanda.discount > 0) {
    msg += `Desconto${comanda.couponCode ? ` (${comanda.couponCode})` : ''}: -${formatBRL(comanda.discount)}\n`;
  }
  msg += `*TOTAL: ${formatBRL(comanda.total)}*\n\n`;

  msg += `💳 *Pagamento:* ${PAYMENT_LABELS[comanda.paymentMethod]}`;
  if (comanda.paymentMethod === 'PIX' && STORE_INFO.pixKey) {
    msg += `\n🔑 Chave Pix: ${STORE_INFO.pixKey}`;
  }
  if (comanda.paymentMethod === 'CASH') {
    msg += comanda.changeFor ? `\n💰 Troco para ${comanda.changeFor}` : `\n💰 Sem troco`;
  }
  msg += `\n\n`;

  msg += `🖨️ *COMANDA PARA IMPRIMIR:*\n${comandaUrl}\n\n`;
  msg += `_Aguardo a confirmação do pedido!_`;

  return msg;
}

/** Link do WhatsApp da loja já com o pedido e o link da comanda prontos para enviar */
export function generateStoreOrderWhatsAppLink(order: Order): { link: string; comandaUrl: string } {
  const comanda = orderToComanda(order);
  
  // O link agora usa apenas um ID curto (?c=1234) em vez de codificar tudo
  const shortId = order.displayId.replace(/\D/g, '');
  const { origin, pathname } = window.location;
  const comandaUrl = `${origin}${pathname.replace(/index\.html$/, '')}?c=${shortId}`;
  
  const text = encodeURIComponent(buildStoreOrderMessage(comanda, comandaUrl));
  return { link: `https://wa.me/${STORE_INFO.whatsapp}?text=${text}`, comandaUrl };
}

export type ReplyKind = 'CONFIRMED' | 'READY' | 'DELIVERY' | 'CANCELED';

export const REPLY_TEMPLATES: Record<ReplyKind, { label: string; icon: string; body: (c: Comanda) => string }> = {
  CONFIRMED: {
    label: 'Confirmar pedido',
    icon: '✅',
    body: (c) =>
      `✅ *PEDIDO CONFIRMADO!*\n\nSeu pedido ${c.displayId} foi aceito e já está sendo preparado na chapa! 🔥\n\nPrevisão de entrega: *${STORE_INFO.prepTime}*.`,
  },
  READY: {
    label: 'Avisar que está pronto',
    icon: '📦',
    body: (c) => `📦 *PEDIDO PRONTO!*\n\nSeu pedido ${c.displayId} ficou pronto e já vai seguir para a entrega/retirada!`,
  },
  DELIVERY: {
    label: 'Saiu para entrega',
    icon: '🛵',
    body: (c) =>
      `🛵 *SAIU PARA ENTREGA!*\n\nSeu pedido ${c.displayId} está a caminho de *${c.address.street}, Nº ${c.address.number} — ${c.address.neighborhood}*. Já já chega quentinho! 🍔`,
  },
  CANCELED: {
    label: 'Cancelar pedido',
    icon: '❌',
    body: (c) =>
      `❌ *PEDIDO CANCELADO*\n\nInfelizmente não conseguimos seguir com o pedido ${c.displayId}. Qualquer dúvida ou necessidade de estorno, é só responder esta mensagem.`,
  },
};

/** Link para a loja responder o cliente pelo WhatsApp (usado na tela da comanda) */
export function generateCustomerReplyWhatsAppLink(comanda: Comanda, kind: ReplyKind): string {
  const phone = formatPhoneForWhatsapp(comanda.customerPhone);
  let msg = `*${STORE_INFO.name.toUpperCase()}* 🍔\n\nOlá, *${comanda.customerName}*!\n\n`;
  msg += REPLY_TEMPLATES[kind].body(comanda);
  msg += `\n\n*Total:* ${formatBRL(comanda.total)} • *Pagamento:* ${PAYMENT_LABELS[comanda.paymentMethod]}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

/** Resumo em texto puro da comanda (botão "copiar" da tela de impressão) */
export function buildComandaPlainText(comanda: Comanda): string {
  let text = `${STORE_INFO.name} — Pedido ${comanda.displayId}\n`;
  text += `${new Date(comanda.createdAt).toLocaleString('pt-BR')}\n\n`;
  text += `Cliente: ${comanda.customerName} (${comanda.customerPhone})\n`;
  text += `Endereço: ${comanda.address.street}, Nº ${comanda.address.number} — ${comanda.address.neighborhood}\n`;
  if (comanda.address.complement) text += `Complemento: ${comanda.address.complement}\n`;
  if (comanda.address.reference) text += `Referência: ${comanda.address.reference}\n\n`;
  text += comanda.items
    .map((item) => {
      let line = `${item.quantity}x ${item.name} — ${formatBRL(item.totalPrice)}`;
      if (item.meatPoint) line += `\n  Ponto: ${item.meatPoint}`;
      if (item.combo) line += `\n  ${item.combo.burger1} | ${item.combo.burger2} | ${item.combo.side}`;
      item.addons?.forEach((a) => (line += `\n  + ${a.name}`));
      if (item.observation) line += `\n  Obs: ${item.observation}`;
      return line;
    })
    .join('\n');
  text += `\n\nSubtotal: ${formatBRL(comanda.subtotal)}`;
  text += `\nEntrega: ${formatBRL(comanda.deliveryFee)}`;
  if (comanda.discount > 0) text += `\nDesconto: -${formatBRL(comanda.discount)}`;
  text += `\nTOTAL: ${formatBRL(comanda.total)}`;
  text += `\nPagamento: ${PAYMENT_LABELS[comanda.paymentMethod]}`;
  if (comanda.paymentMethod === 'CASH' && comanda.changeFor) text += ` (troco para ${comanda.changeFor})`;
  return text;
}
