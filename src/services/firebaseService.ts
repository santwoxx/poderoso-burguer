import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Order, Product, Neighborhood, OrderStatus, StoreSettings } from '../types';
import {
  loadOrders,
  saveOrders,
  loadProducts,
  saveProducts,
  loadNeighborhoods,
  saveNeighborhoods,
  loadSettings,
  saveSettings,
} from '../utils/storage';

const COLLECTIONS = {
  ORDERS: 'orders',
  PRODUCTS: 'products',
  NEIGHBORHOODS: 'neighborhoods',
  SETTINGS: 'settings',
};

/**
 * Subscribe to Orders collection in Realtime from Firestore with LocalStorage fallback
 */
export function subscribeOrders(onUpdate: (orders: Order[]) => void) {
  try {
    const q = query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Order[] = snapshot.docs.map((docSnap) => docSnap.data() as Order);
          saveOrders(list);
          onUpdate(list);
        } else {
          // If Firestore collection is empty, seed with initial/local orders
          const local = loadOrders();
          onUpdate(local);
        }
      },
      (error) => {
        console.warn('Firestore orders error, fallback to localStorage:', error);
        onUpdate(loadOrders());
      }
    );
  } catch (e) {
    console.warn('Firestore subscription failed, fallback to localStorage:', e);
    onUpdate(loadOrders());
    return () => {};
  }
}

/**
 * Subscribe to a specific Order by ID (for customers)
 */
export function subscribeToOrderById(orderId: string, onUpdate: (order: Order | null) => void) {
  try {
    const docId = orderId.replace('#', 'PB_');
    return onSnapshot(
      doc(db, COLLECTIONS.ORDERS, docId),
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as Order);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.warn('Firestore single order error:', error);
      }
    );
  } catch (e) {
    return () => {};
  }
}

/**
 * Subscribe to Products in Realtime
 */
export function subscribeProducts(onUpdate: (products: Product[]) => void) {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.PRODUCTS),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = snapshot.docs.map((docSnap) => docSnap.data() as Product);
          saveProducts(list);
          onUpdate(list);
        } else {
          onUpdate(loadProducts());
        }
      },
      (error) => {
        console.warn('Firestore products error, fallback to localStorage:', error);
        onUpdate(loadProducts());
      }
    );
  } catch (e) {
    onUpdate(loadProducts());
    return () => {};
  }
}

/**
 * Subscribe to Neighborhoods in Realtime
 */
export function subscribeNeighborhoods(onUpdate: (neighborhoods: Neighborhood[]) => void) {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.NEIGHBORHOODS),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Neighborhood[] = snapshot.docs.map((docSnap) => docSnap.data() as Neighborhood);
          saveNeighborhoods(list);
          onUpdate(list);
        } else {
          onUpdate(loadNeighborhoods());
        }
      },
      (error) => {
        console.warn('Firestore neighborhoods error, fallback to localStorage:', error);
        onUpdate(loadNeighborhoods());
      }
    );
  } catch (e) {
    onUpdate(loadNeighborhoods());
    return () => {};
  }
}

/**
 * Save / Create Order in Firestore & LocalStorage
 */
export async function saveOrderDb(order: Order): Promise<void> {
  // Always update LocalStorage immediately for instant UX
  const currentLocal = loadOrders();
  const updatedLocal = [order, ...currentLocal.filter((o) => o.id !== order.id)];
  saveOrders(updatedLocal);

  try {
    // Sanitize id for Firestore doc reference
    const docId = order.id.replace('#', 'PB_');
    await setDoc(doc(db, COLLECTIONS.ORDERS, docId), order);
  } catch (e) {
    console.error('Error saving order to Firestore:', e);
  }
}

/**
 * Update Order Status in Firestore & LocalStorage
 */
export async function updateOrderStatusDb(orderId: string, status: OrderStatus): Promise<void> {
  const currentLocal = loadOrders();
  const updatedLocal = currentLocal.map((o) => {
    if (o.id === orderId) {
      const history = o.statusHistory || [];
      return {
        ...o,
        status,
        statusHistory: [...history, { status, timestamp: new Date().toISOString() }],
      };
    }
    return o;
  });
  saveOrders(updatedLocal);

  try {
    const targetOrder = updatedLocal.find((o) => o.id === orderId);
    if (targetOrder) {
      const docId = orderId.replace('#', 'PB_');
      await setDoc(doc(db, COLLECTIONS.ORDERS, docId), targetOrder);
    }
  } catch (e) {
    console.error('Error updating order status in Firestore:', e);
  }
}

/**
 * Delete / Remove Order in Firestore & LocalStorage
 */
export async function deleteOrderDb(orderId: string): Promise<void> {
  const currentLocal = loadOrders();
  const updatedLocal = currentLocal.filter((o) => o.id !== orderId);
  saveOrders(updatedLocal);

  try {
    const docId = orderId.replace('#', 'PB_');
    await deleteDoc(doc(db, COLLECTIONS.ORDERS, docId));
  } catch (e) {
    console.error('Error deleting order from Firestore:', e);
  }
}

/**
 * Batch Save Products to Firestore
 */
export async function saveProductsDb(products: Product[]): Promise<void> {
  saveProducts(products);

  try {
    for (const p of products) {
      await setDoc(doc(db, COLLECTIONS.PRODUCTS, p.id), p);
    }
  } catch (e) {
    console.error('Error saving products to Firestore:', e);
  }
}

/**
 * Batch Save Neighborhoods to Firestore
 */
export async function saveNeighborhoodsDb(neighborhoods: Neighborhood[]): Promise<void> {
  saveNeighborhoods(neighborhoods);

  try {
    for (const n of neighborhoods) {
      await setDoc(doc(db, COLLECTIONS.NEIGHBORHOODS, n.id), n);
    }
  } catch (e) {
    console.error('Error saving neighborhoods to Firestore:', e);
  }
}

/**
 * Subscribe to Global Settings in Realtime
 */
export function subscribeSettings(onUpdate: (settings: StoreSettings) => void) {
  try {
    return onSnapshot(
      doc(db, COLLECTIONS.SETTINGS, 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          const settingsData = docSnap.data() as StoreSettings;
          saveSettings(settingsData);
          onUpdate(settingsData);
        } else {
          onUpdate(loadSettings());
        }
      },
      (error) => {
        console.warn('Firestore settings error, fallback to localStorage:', error);
        onUpdate(loadSettings());
      }
    );
  } catch (e) {
    onUpdate(loadSettings());
    return () => {};
  }
}

/**
 * Save Global Settings to Firestore
 */
export async function saveSettingsDb(settings: StoreSettings): Promise<void> {
  saveSettings(settings);
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'global'), settings);
  } catch (e) {
    console.error('Error saving settings to Firestore:', e);
  }
}
