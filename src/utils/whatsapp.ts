import type { Order, OrderStatus } from '../types';
import { STORE_INFO } from '../data/mockData';

export function formatPhoneForWhatsapp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  return `55${digits}`;
}

export function generateCustomerOrderWhatsAppLink(order: Order): string {
  const storePhone = STORE_INFO.whatsapp;
  
  let msg = `*🍔 PEDIDO ${order.displayId || order.id} - ${STORE_INFO.name.toUpperCase()}*\n\n`;
  msg += `👤 *Cliente:* ${order.customerName}\n`;
  msg += `📞 *Telefone:* ${order.customerPhone}\n\n`;

  msg += `📍 *ENDEREÇO DE ENTREGA:*\n`;
  msg += `• Bairro: *${order.address.neighborhood}*\n`;
  msg += `• Logradouro: ${order.address.street}, Nº ${order.address.number}\n`;
  if (order.address.complement) msg += `• Comp: ${order.address.complement}\n`;
  if (order.address.reference) msg += `• Ref: ${order.address.reference}\n`;
  msg += `\n`;

  msg += `🛒 *ITENS DO PEDIDO:*\n`;
  order.items.forEach((item, index) => {
    msg += `*${index + 1}. ${item.quantity}x ${item.product.name}* - R$ ${(item.totalPrice).toFixed(2).replace('.', ',')}\n`;
    if (item.options?.meatPoint) {
      msg += `   🥩 Ponto: _${item.options.meatPoint}_\n`;
    }
    if (item.options?.comboSelections) {
      msg += `   🍔 Hambúrguer 1: _${item.options.comboSelections.burger1}_\n`;
      msg += `   🍔 Hambúrguer 2: _${item.options.comboSelections.burger2}_\n`;
      msg += `   🍟 Acompanhamento: _${item.options.comboSelections.side}_\n`;
    }
    if (item.options?.addons && item.options.addons.length > 0) {
      msg += `   🧀 Adicionais:\n`;
      item.options.addons.forEach(add => {
        msg += `      + ${add.name} (+R$ ${add.price.toFixed(2).replace('.', ',')})\n`;
      });
    }
    if (item.options?.observation) {
      msg += `   📝 Obs: _${item.options.observation}_\n`;
    }
  });

  msg += `\n💵 *RESUMO DE VALORES:*\n`;
  msg += `• Subtotal: R$ ${order.subtotal.toFixed(2).replace('.', ',')}\n`;
  msg += `• Taxa de Entrega (${order.address.neighborhood}): R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}\n`;

  msg += `👉 *TOTAL: R$ ${order.total.toFixed(2).replace('.', ',')}*\n\n`;

  msg += `💳 *Forma de Pagamento:* ${
    order.paymentMethod === 'PIX' ? `Pix ⚡\n🔑 *Chave PIX (Celular):* ${STORE_INFO.pixKey || '73999467595'}` :
    order.paymentMethod === 'CARD' ? 'Cartão 💳' :
    `Dinheiro 💵 ${order.changeFor ? `(Troco para R$ ${order.changeFor})` : '(Sem troco)'}`
  }\n\n`;

  const baseUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
  if (baseUrl) {
    const orderParam = order.id.replace('#', '');
    const separator = baseUrl.endsWith('/') ? '' : '/';
    msg += `🔗 *Acompanhe seu pedido ao vivo:*\n${baseUrl}${separator}?order=${orderParam}\n\n`;
  }

  msg += `Aguardando a confirmação do meu pedido! Obrigado! 🍔🔥`;

  const encodedMsg = encodeURIComponent(msg);
  return `https://wa.me/${storePhone}?text=${encodedMsg}`;
}

export const STATUS_LABELS: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  ANALYSIS: { label: 'Em Análise', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '⏳' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '✅' },
  DELIVERY: { label: 'Saiu p/ Entrega', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '🛵' },
  COMPLETED: { label: 'Concluído', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '🎉' },
  CANCELED: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '❌' },
};

export function generateAdminStatusWhatsAppLink(order: Order, newStatus: OrderStatus): string {
  const formattedPhone = formatPhoneForWhatsapp(order.customerPhone);
  
  let msg = `*${STORE_INFO.name.toUpperCase()} - ATUALIZAÇÃO DE PEDIDO* 🍔\n\n`;
  msg += `Olá, *${order.customerName}*!\n\n`;
  msg += `O status do seu pedido *${order.displayId || order.id}* foi atualizado:\n\n`;

  switch (newStatus) {
    case 'ANALYSIS':
      msg += `⏳ *EM ANÁLISE*: Estamos analisando seu pedido e logo confirmaremos!`;
      break;
    case 'CONFIRMED':
      msg += `✅ *CONFIRMADO*: Seu pedido foi confirmado e já está sendo preparado na chapa com todo o carinho! 🔥🍔`;
      break;
    case 'DELIVERY':
      msg += `🛵 *SAIU PARA ENTREGA*: Nosso motoboy já está a caminho do seu endereço (*${order.address.neighborhood}*) com seu pedido quentinho!`;
      break;
    case 'COMPLETED':
      msg += `🎉 *CONCLUÍDO*: Pedido entregue! Esperamos que você saboreie cada mordida. Bom apetite e volte sempre ao ${STORE_INFO.name}! ⭐`;
      break;
    case 'CANCELED':
      msg += `❌ *CANCELADO*: Seu pedido foi cancelado. Se tiver alguma dúvida ou precisar de estorno, responda essa mensagem.`;
      break;
  }

  msg += `\n\n*Resumo:* ${order.items.length} item(ns) • Total: R$ ${order.total.toFixed(2).replace('.', ',')}`;

  const encodedMsg = encodeURIComponent(msg);
  return `https://wa.me/${formattedPhone}?text=${encodedMsg}`;
}
