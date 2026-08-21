import type { Order, PaymentMethod, CustomerAddress } from '../types';

/**
 * O pedido não fica salvo em banco nenhum: ele é codificado dentro da própria URL
 * da comanda, que segue junto com a mensagem do WhatsApp. Quem tem o link tem o
 * pedido — o balcão abre, imprime e confirma com o cliente, sem depender de login,
 * de internet do painel ou de qualquer sincronização.
 */

export const COMANDA_PARAM = 'comanda';

export interface ComandaItem {
  quantity: number;
  name: string;
  totalPrice: number;
  meatPoint?: string;
  addons?: { name: string; price: number }[];
  observation?: string;
  combo?: { burger1: string; burger2: string; side: string };
}

export interface Comanda {
  displayId: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  address: CustomerAddress;
  paymentMethod: PaymentMethod;
  changeFor?: string;
  items: ComandaItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  total: number;
}

// Formato serializado — chaves curtas porque cada byte vira caracter na URL do WhatsApp
interface PackedItem {
  q: number;
  n: string;
  v: number;
  p?: string;
  a?: [string, number][];
  o?: string;
  c?: [string, string, string];
}

interface PackedComanda {
  v: 1;
  d: string;
  t: string;
  n: string;
  f: string;
  e: [string, string, string, string?, string?];
  m: PaymentMethod;
  ch?: string;
  i: PackedItem[];
  s: number;
  x: number;
  y?: number;
  cp?: string;
  g: number;
}

export function orderToComanda(order: Order): Comanda {
  return {
    displayId: order.displayId,
    createdAt: order.createdAt,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    address: order.address,
    paymentMethod: order.paymentMethod,
    changeFor: order.changeFor,
    items: order.items.map((item) => ({
      quantity: item.quantity,
      name: item.product.name,
      totalPrice: item.totalPrice,
      meatPoint: item.options?.meatPoint,
      addons: item.options?.addons?.map((a) => ({ name: a.name, price: a.price })),
      observation: item.options?.observation,
      combo: item.options?.comboSelections,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    couponCode: order.couponCode,
    total: order.total,
  };
}

function pack(c: Comanda): PackedComanda {
  const packed: PackedComanda = {
    v: 1,
    d: c.displayId,
    t: c.createdAt,
    n: c.customerName,
    f: c.customerPhone,
    e: [c.address.street, c.address.number, c.address.neighborhood, c.address.complement || undefined, c.address.reference || undefined],
    m: c.paymentMethod,
    i: c.items.map((item) => {
      const pi: PackedItem = { q: item.quantity, n: item.name, v: round(item.totalPrice) };
      if (item.meatPoint) pi.p = item.meatPoint;
      if (item.addons?.length) pi.a = item.addons.map((a) => [a.name, round(a.price)]);
      if (item.observation) pi.o = item.observation;
      if (item.combo) pi.c = [item.combo.burger1, item.combo.burger2, item.combo.side];
      return pi;
    }),
    s: round(c.subtotal),
    x: round(c.deliveryFee),
    g: round(c.total),
  };
  if (c.changeFor) packed.ch = c.changeFor;
  if (c.discount > 0) packed.y = round(c.discount);
  if (c.couponCode) packed.cp = c.couponCode;
  return packed;
}

function unpack(p: PackedComanda): Comanda {
  return {
    displayId: p.d,
    createdAt: p.t,
    customerName: p.n,
    customerPhone: p.f,
    address: {
      street: p.e[0],
      number: p.e[1],
      neighborhood: p.e[2],
      complement: p.e[3],
      reference: p.e[4],
    },
    paymentMethod: p.m,
    changeFor: p.ch,
    items: (p.i || []).map((pi) => ({
      quantity: pi.q,
      name: pi.n,
      totalPrice: pi.v,
      meatPoint: pi.p,
      addons: pi.a?.map(([name, price]) => ({ name, price })),
      observation: pi.o,
      combo: pi.c ? { burger1: pi.c[0], burger2: pi.c[1], side: pi.c[2] } : undefined,
    })),
    subtotal: p.s,
    deliveryFee: p.x,
    discount: p.y || 0,
    couponCode: p.cp,
    total: p.g,
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const base64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeComanda(comanda: Comanda): string {
  return toBase64Url(JSON.stringify(pack(comanda)));
}

export function decodeComanda(code: string): Comanda | null {
  try {
    const parsed = JSON.parse(fromBase64Url(code)) as PackedComanda;
    if (parsed?.v !== 1 || !Array.isArray(parsed.i)) return null;
    return unpack(parsed);
  } catch {
    return null;
  }
}

/** URL absoluta da comanda imprimível deste pedido */
export function buildComandaUrl(order: Order): string {
  const code = encodeComanda(orderToComanda(order));
  const { origin, pathname } = window.location;
  return `${origin}${pathname.replace(/index\.html$/, '')}?${COMANDA_PARAM}=${code}`;
}

/** Lê a comanda da URL atual (usado no boot do app para decidir qual tela abrir) */
export function readComandaFromUrl(): Comanda | null {
  if (typeof window === 'undefined') return null;
  const code = new URLSearchParams(window.location.search).get(COMANDA_PARAM);
  return code ? decodeComanda(code) : null;
}
