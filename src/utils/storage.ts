import type { Product, Neighborhood, Order, Category, Customer, StoreSettings } from '../types';
import { INITIAL_PRODUCTS, INITIAL_NEIGHBORHOODS, MOCK_INITIAL_ORDERS, INITIAL_CATEGORIES } from '../data/mockData';

const KEYS = {
  PRODUCTS: 'poderoso_burguer_products',
  CATEGORIES: 'poderoso_burguer_categories',
  NEIGHBORHOODS: 'poderoso_burguer_neighborhoods',
  ORDERS: 'poderoso_burguer_orders',
  SETTINGS: 'poderoso_burguer_settings',
};

function get<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('Error reading localStorage key:', key, e);
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage key:', key, e);
  }
}

export function loadProducts(): Product[] {
  const stored = get<Product[] | null>(KEYS.PRODUCTS, null);
  if (!stored || stored.length === 0) {
    saveProducts(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  }

  const updatedInitial = INITIAL_PRODUCTS.map((initP) => {
    const existing = stored.find((p) => p.id === initP.id);
    if (!existing) return initP;
    return {
      ...existing,
      name: initP.name,
      price: initP.price,
      originalPrice: initP.originalPrice,
      description: initP.description,
      category: initP.category,
      image: initP.image, // Force update image from code to fix cached wrong images
    };
  });

  const customProducts = stored.filter((p) => !INITIAL_PRODUCTS.some((initP) => initP.id === p.id));
  const fullList = [...updatedInitial, ...customProducts];
  saveProducts(fullList);
  return fullList;
}

export function saveProducts(products: Product[]): void {
  set(KEYS.PRODUCTS, products);
}

export function loadCategories(): Category[] {
  return get<Category[]>(KEYS.CATEGORIES, INITIAL_CATEGORIES);
}

export function saveCategories(categories: Category[]): void {
  set(KEYS.CATEGORIES, categories);
}

export function loadNeighborhoods(): Neighborhood[] {
  return get<Neighborhood[]>(KEYS.NEIGHBORHOODS, INITIAL_NEIGHBORHOODS);
}

export function saveNeighborhoods(neighborhoods: Neighborhood[]): void {
  set(KEYS.NEIGHBORHOODS, neighborhoods);
}

export function loadOrders(): Order[] {
  return get<Order[]>(KEYS.ORDERS, MOCK_INITIAL_ORDERS);
}

export function saveOrders(orders: Order[]): void {
  set(KEYS.ORDERS, orders);
}

export function addOrder(order: Order): Order[] {
  const current = loadOrders();
  const updated = [order, ...current];
  saveOrders(updated);
  return updated;
}

export function updateOrderStatus(orderId: string, status: Order['status']): Order[] {
  const current = loadOrders();
  const updated = current.map((order) => {
    if (order.id === orderId) {
      const history = order.statusHistory || [];
      return {
        ...order,
        status,
        statusHistory: [...history, { status, timestamp: new Date().toISOString() }],
      };
    }
    return order;
  });
  saveOrders(updated);
  return updated;
}

export function deriveCustomersFromOrders(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();

  orders.forEach((order) => {
    const phone = order.customerPhone.replace(/\D/g, '');
    if (!phone) return;

    const existing = map.get(phone);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpent += order.total;
      if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = order.createdAt;
        existing.name = order.customerName;
      }
    } else {
      map.set(phone, {
        id: phone,
        phone: order.customerPhone,
        name: order.customerName,
        ordersCount: 1,
        totalSpent: order.total,
        lastOrderDate: order.createdAt,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());
}

export function loadSettings(): StoreSettings {
  return get<StoreSettings>(KEYS.SETTINGS, { theme: 'dark' });
}

export function saveSettings(settings: StoreSettings): void {
  set(KEYS.SETTINGS, settings);
}
