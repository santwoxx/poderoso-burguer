import type { Product, Neighborhood, Category, StoreSettings } from '../types';
import { INITIAL_PRODUCTS, INITIAL_NEIGHBORHOODS, INITIAL_CATEGORIES } from '../data/mockData';

const KEYS = {
  PRODUCTS: 'poderoso_burguer_products',
  CATEGORIES: 'poderoso_burguer_categories',
  NEIGHBORHOODS: 'poderoso_burguer_neighborhoods',
  SETTINGS: 'poderoso_burguer_settings',
  REGISTERED_CUSTOMERS: 'poderoso_burguer_registered_customers',
  LAST_ORDER: 'poderoso_burguer_last_order',
  GUEST_PROFILE: 'poderoso_burguer_guest_profile',
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

export function loadSettings(): StoreSettings {
  return get<StoreSettings>(KEYS.SETTINGS, { theme: 'dark' });
}

export function saveSettings(settings: StoreSettings): void {
  set(KEYS.SETTINGS, settings);
}

/**
 * Marca, neste navegador, quais cadastros já foram criados — assim um cliente que
 * volta a pedir atualiza o cadastro sem resetar a data em que ele apareceu pela
 * primeira vez (o cliente sem login não tem permissão para ler o próprio documento).
 */
export function hasRegisteredCustomer(customerId: string): boolean {
  return get<string[]>(KEYS.REGISTERED_CUSTOMERS, []).includes(customerId);
}

export function markCustomerRegistered(customerId: string): void {
  const current = get<string[]>(KEYS.REGISTERED_CUSTOMERS, []);
  if (current.includes(customerId)) return;
  set(KEYS.REGISTERED_CUSTOMERS, [...current, customerId].slice(-20));
}

/** Link da comanda do último pedido feito neste navegador (para reenviar no WhatsApp) */
export function saveLastOrderLink(link: { displayId: string; comandaUrl: string; whatsappUrl: string; createdAt: string }): void {
  set(KEYS.LAST_ORDER, link);
}

export function loadLastOrderLink(): { displayId: string; comandaUrl: string; whatsappUrl: string; createdAt: string } | null {
  return get<{ displayId: string; comandaUrl: string; whatsappUrl: string; createdAt: string } | null>(
    KEYS.LAST_ORDER,
    null
  );
}

export function saveGuestProfile(profile: any): void {
  set(KEYS.GUEST_PROFILE, profile);
}

export function loadGuestProfile(): any | null {
  return get<any | null>(KEYS.GUEST_PROFILE, null);
}
