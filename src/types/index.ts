export interface ProductAddon {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  isAvailable: boolean;
  requiresMeatPoint?: boolean;
  availableAddons?: ProductAddon[];
  isCustomCombo?: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  deliveryFee: number;
  estimatedTime: string;
  isActive: boolean;
}

export interface CartItemOption {
  meatPoint?: string;
  addons?: ProductAddon[];
  observation?: string;
  comboSelections?: {
    burger1: string;
    burger2: string;
    side: string;
  };
}

export interface CartItem {
  id: string; // unique cart item id
  product: Product;
  quantity: number;
  options?: CartItemOption;
  totalPrice: number;
}

export interface CustomerAddress {
  street: string;
  number: string;
  neighborhood: string;
  complement?: string;
  reference?: string;
}

export type PaymentMethod = 'PIX' | 'CARD' | 'CASH';

/**
 * Pedido. Não é persistido no banco: viaja do carrinho para o WhatsApp da loja
 * e, codificado na URL da comanda, para a tela de impressão do balcão.
 */
export interface Order {
  id: string; // UUID
  displayId: string; // ex: #PB-1042
  createdAt: string; // ISO string
  customerName: string;
  customerPhone: string;
  address: CustomerAddress;
  paymentMethod: PaymentMethod;
  changeFor?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  total: number;
}

export interface StoreSettings {
  theme: 'light' | 'dark';
}

/**
 * Cadastro do cliente — é o que alimenta o Painel Administrativo.
 * O id do documento é o UID do Firebase Auth (login Google) ou `g_<telefone>`
 * para quem pede sem login.
 */
export interface CustomerProfile {
  uid: string;
  email: string;
  name: string;
  cpf?: string;
  phone?: string;
  address?: CustomerAddress;
  source?: 'google' | 'guest';
  ordersCount?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}
