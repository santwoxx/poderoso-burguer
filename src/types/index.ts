export type OrderStatus = 'ANALYSIS' | 'CONFIRMED' | 'DELIVERY' | 'COMPLETED' | 'CANCELED';

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

export interface Order {
  id: string; // e.g. #PB-1042
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
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
  }[];
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface StoreSettings {
  theme: 'light' | 'dark';
}
