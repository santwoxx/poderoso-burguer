import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Order, Product, Neighborhood, StoreSettings, CustomerProfile } from '../types';
import {
  loadProducts,
  saveProducts,
  loadNeighborhoods,
  saveNeighborhoods,
  loadSettings,
  saveSettings,
  hasRegisteredCustomer,
  markCustomerRegistered,
} from '../utils/storage';

const COLLECTIONS = {
  PRODUCTS: 'products',
  NEIGHBORHOODS: 'neighborhoods',
  SETTINGS: 'settings',
  CUSTOMERS: 'customers',
  COMANDAS: 'comandas',
};

// Firestore rejeita campos com valor undefined (ex: campos opcionais não preenchidos).
// Serializando via JSON removemos essas chaves antes de gravar, evitando falhas silenciosas no setDoc.
function sanitizeForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
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
 * Create / Update a single Product (used by the Admin Panel)
 */
export async function saveProductDb(product: Product): Promise<void> {
  const current = loadProducts();
  saveProducts([product, ...current.filter((p) => p.id !== product.id)]);

  try {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), sanitizeForFirestore(product));
  } catch (e) {
    console.error('Error saving product to Firestore:', e);
  }
}

/**
 * Delete a single Product (used by the Admin Panel)
 */
export async function deleteProductDb(productId: string): Promise<void> {
  saveProducts(loadProducts().filter((p) => p.id !== productId));

  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  } catch (e) {
    console.error('Error deleting product from Firestore:', e);
  }
}

/**
 * Upload a Product photo to Firebase Storage and return its public download URL
 */
export async function uploadProductImage(file: Blob, fileName: string): Promise<string> {
  const imageRef = ref(storage, `products/${fileName}`);
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
}

/**
 * Create / Update a single Neighborhood (used by the Admin Panel)
 */
export async function saveNeighborhoodDb(neighborhood: Neighborhood): Promise<void> {
  const current = loadNeighborhoods();
  saveNeighborhoods([neighborhood, ...current.filter((n) => n.id !== neighborhood.id)]);

  try {
    await setDoc(doc(db, COLLECTIONS.NEIGHBORHOODS, neighborhood.id), sanitizeForFirestore(neighborhood));
  } catch (e) {
    console.error('Error saving neighborhood to Firestore:', e);
  }
}

/**
 * Delete a single Neighborhood (used by the Admin Panel)
 */
export async function deleteNeighborhoodDb(neighborhoodId: string): Promise<void> {
  saveNeighborhoods(loadNeighborhoods().filter((n) => n.id !== neighborhoodId));

  try {
    await deleteDoc(doc(db, COLLECTIONS.NEIGHBORHOODS, neighborhoodId));
  } catch (e) {
    console.error('Error deleting neighborhood from Firestore:', e);
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
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'global'), sanitizeForFirestore(settings));
  } catch (e) {
    console.error('Error saving settings to Firestore:', e);
  }
}

/**
 * Fetch a single Customer Profile by their Firebase Auth UID
 */
export async function fetchCustomerProfileDb(uid: string): Promise<CustomerProfile | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.CUSTOMERS, uid));
    return snap.exists() ? (snap.data() as CustomerProfile) : null;
  } catch (e) {
    console.error('Error fetching customer profile from Firestore:', e);
    return null;
  }
}

/**
 * Create / Update a Customer Profile (name, cpf, phone, address) tied to their Google account
 */
export async function saveCustomerProfileDb(profile: CustomerProfile): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, profile.uid), sanitizeForFirestore(profile), { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving customer profile to Firestore:', e);
    return false;
  }
}

/** Id do cadastro de quem pede sem login: derivado do telefone, para não duplicar cliente */
export function guestCustomerId(phone: string): string {
  return 'g_' + phone.replace(/\D/g, '');
}

/**
 * Registra/atualiza o cadastro do cliente no fechamento do pedido — é isto que chega
 * ao Painel Administrativo (o pedido em si vai para o WhatsApp da loja).
 * Funciona com ou sem login: sem login, o cadastro é indexado pelo telefone.
 */
export async function registerCustomerFromOrder(
  order: Order,
  profile: CustomerProfile | null
): Promise<void> {
  const digits = order.customerPhone.replace(/\D/g, '');
  if (!profile && digits.length < 10) return;

  const docId = profile?.uid || guestCustomerId(order.customerPhone);
  const nowIso = new Date().toISOString();

  const payload: Record<string, unknown> = {
    uid: docId,
    name: order.customerName,
    phone: order.customerPhone,
    address: order.address,
    source: profile ? 'google' : 'guest',
    email: profile?.email || '',
    lastOrderDate: order.createdAt,
    ordersCount: increment(1),
    totalSpent: increment(Math.round(order.total * 100) / 100),
    updatedAt: nowIso,
  };
  if (profile?.cpf) payload.cpf = profile.cpf;

  // createdAt só na primeira vez, para não sobrescrever a data original do cadastro
  if (!profile && !hasRegisteredCustomer(docId)) payload.createdAt = nowIso;

  try {
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, docId), payload, { merge: true });
    markCustomerRegistered(docId);
  } catch (e) {
    console.error('Error registering customer from order:', e);
  }
}

/**
 * Subscribe to all registered Customer Profiles in Realtime (used by the Admin Panel)
 */
export function subscribeCustomers(onUpdate: (customers: CustomerProfile[]) => void) {
  try {
    return onSnapshot(
      collection(db, COLLECTIONS.CUSTOMERS),
      (snapshot) => {
        onUpdate(
          snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as CustomerProfile), uid: docSnap.id }))
        );
      },
      (error) => {
        console.warn('Firestore customers error:', error);
        onUpdate([]);
      }
    );
  } catch (e) {
    onUpdate([]);
    return () => {};
  }
}

/**
 * Remove um cadastro de cliente (aba Clientes do Painel)
 */
export async function deleteCustomerDb(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, uid));
  } catch (e) {
    console.error('Error deleting customer from Firestore:', e);
  }
}

/**
 * Salva a comanda no Firestore para gerar um link curto.
 */
export async function saveComandaDb(displayId: string, payload: any): Promise<void> {
  try {
    const docId = displayId.replace(/\D/g, ''); // Usa apenas os números do displayId como ID
    await setDoc(doc(db, COLLECTIONS.COMANDAS, docId), sanitizeForFirestore(payload));
  } catch (e) {
    console.error('Error saving comanda to Firestore:', e);
  }
}

/**
 * Busca uma comanda no Firestore pelo ID curto.
 */
export async function fetchComandaDb(shortId: string): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.COMANDAS, shortId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('Error fetching comanda from Firestore:', e);
    return null;
  }
}
