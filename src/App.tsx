import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './config/firebase';
import { Header } from './components/Header';
import { CategoryTabs } from './components/CategoryTabs';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { DeliveryCalculatorModal } from './components/DeliveryCalculatorModal';
import { CouponModal } from './components/CouponModal';
import { LoginModal } from './components/LoginModal';
import { FluidCursor } from './components/FluidCursor';
import { FloatingCartBar } from './components/FloatingCartBar';
import { OrderSuccessModal, type SentOrder } from './components/OrderSuccessModal';
import type {
  Product,
  Category,
  Neighborhood,
  Order,
  CartItem,
  CartItemOption,
  CustomerProfile,
} from './types';
import {
  subscribeProducts,
  subscribeNeighborhoods,
  subscribeSettings,
  fetchCustomerProfileDb,
  saveCustomerProfileDb,
  registerCustomerFromOrder,
} from './services/firebaseService';
import {
  loadCategories,
  loadSettings,
  loadProducts,
  loadNeighborhoods,
  saveLastOrderLink,
  loadLastOrderLink,
} from './utils/storage';
import { readComandaFromUrl } from './utils/orderCode';
import { generateStoreOrderWhatsAppLink } from './utils/whatsapp';
import { STORE_INFO, ADMIN_EMAILS } from './data/mockData';
import { MessageCircle, Printer } from 'lucide-react';

// Painel e comanda só são baixados por quem realmente abre cada um deles
const AdminPanel = lazy(() =>
  import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);
const ComandaPage = lazy(() =>
  import('./components/ComandaPage').then((m) => ({ default: m.ComandaPage }))
);

const Instagram = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Splash = ({ label }: { label: string }) => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
    {label}
  </div>
);

// A comanda é lida uma única vez, no boot: se o link tiver pedido, esta é a tela.
const initialComanda = readComandaFromUrl();

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories] = useState<Category[]>(loadCategories);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [userProfile, setUserProfile] = useState<CustomerProfile | null>(null);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || 'pequenos-precos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const isAdmin = !!firebaseUser?.email && ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase());

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDeliveryCalculatorOpen, setIsDeliveryCalculatorOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [sentOrder, setSentOrder] = useState<SentOrder | null>(null);
  const [lastOrder, setLastOrder] = useState(() => (initialComanda ? null : loadLastOrderLink()));

  // Track Firebase Auth state to detect Admin logins (Google Sign-In)
  useEffect(() => {
    if (initialComanda) return;
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthChecked(true);
    });
  }, []);

  // Para clientes logados (não-admin), carrega o perfil salvo (cpf/telefone/endereço) do
  // Firestore, ou cria um perfil mínimo na primeira vez — assim o próximo pedido já vem
  // pré-preenchido, mesmo em uma sessão nova (a sessão do Google persiste no navegador).
  useEffect(() => {
    if (!firebaseUser || isAdmin) {
      setUserProfile(null);
      return;
    }

    let cancelled = false;
    fetchCustomerProfileDb(firebaseUser.uid).then((profile) => {
      if (cancelled) return;
      if (profile) {
        setUserProfile(profile);
      } else {
        const nowIso = new Date().toISOString();
        setUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'Cliente Google',
          source: 'google',
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, isAdmin]);

  // Cardápio, bairros e tema em tempo real (o pedido em si não passa mais pelo banco)
  useEffect(() => {
    if (initialComanda) return;

    const unsubProducts = subscribeProducts(setProducts);
    const unsubNeighborhoods = subscribeNeighborhoods((liveNeighs) => {
      setNeighborhoods(liveNeighs);
      setSelectedNeighborhood((current) => {
        if (current || liveNeighs.length === 0) return current;
        const saoPedro = liveNeighs.find((n) => n.id === 'nb-sao-pedro' && n.isActive);
        return saoPedro || liveNeighs.find((n) => n.isActive) || liveNeighs[0];
      });
    });
    const unsubSettings = subscribeSettings((liveSettings) => {
      document.body.classList.toggle('light', liveSettings.theme === 'light');
    });

    return () => {
      unsubProducts();
      unsubNeighborhoods();
      unsubSettings();
    };
  }, []);

  // Listen for cross-tab localStorage updates (fallback if Firebase is delayed/offline)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'poderoso_burguer_products') {
        setProducts(loadProducts());
      } else if (e.key === 'poderoso_burguer_neighborhoods') {
        setNeighborhoods(loadNeighborhoods());
      } else if (e.key === 'poderoso_burguer_settings') {
        document.body.classList.toggle('light', loadSettings().theme === 'light');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAddToCart = useCallback((product: Product, quantity: number, options: CartItemOption) => {
    const addonsTotal = options.addons ? options.addons.reduce((sum, a) => sum + a.price, 0) : 0;
    const unitPrice = product.price + addonsTotal;

    setCart((prev) => [
      ...prev,
      {
        id: `cart-item-${Date.now()}-${Math.random()}`,
        product,
        quantity,
        options,
        totalPrice: unitPrice * quantity,
      },
    ]);
    setIsCartOpen(true);
  }, []);

  const handleRemoveCartItem = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  }, []);

  const handleUpdateCartQuantity = useCallback(
    (cartItemId: string, newQty: number) => {
      if (newQty <= 0) {
        handleRemoveCartItem(cartItemId);
        return;
      }
      setCart((prev) =>
        prev.map((item) => {
          if (item.id !== cartItemId) return item;
          const addonsTotal = item.options?.addons
            ? item.options.addons.reduce((sum, a) => sum + a.price, 0)
            : 0;
          return {
            ...item,
            quantity: newQty,
            totalPrice: (item.product.price + addonsTotal) * newQty,
          };
        })
      );
    },
    [handleRemoveCartItem]
  );

  const handleClearCart = useCallback(() => setCart([]), []);

  /**
   * Fechamento do pedido: a comanda vai para o WhatsApp da loja (com link de impressão)
   * e o que fica registrado no Painel Administrativo é o cadastro do cliente.
   */
  const handleOrderPlaced = useCallback(
    (newOrder: Order) => {
      const { link, comandaUrl } = generateStoreOrderWhatsAppLink(newOrder);

      // Abre junto com o clique do usuário, senão o navegador bloqueia o pop-up
      const opened = window.open(link, '_blank', 'noopener,noreferrer');

      setSentOrder({
        displayId: newOrder.displayId,
        total: newOrder.total,
        customerName: newOrder.customerName,
        whatsappUrl: link,
        comandaUrl,
        blocked: !opened,
      });

      const lastOrderInfo = {
        displayId: newOrder.displayId,
        comandaUrl,
        whatsappUrl: link,
        createdAt: newOrder.createdAt,
      };
      saveLastOrderLink(lastOrderInfo);
      setLastOrder(lastOrderInfo);

      // Cadastro do cliente — com ou sem login — é o que alimenta o Painel
      registerCustomerFromOrder(newOrder, userProfile);

      if (userProfile) {
        const updatedProfile: CustomerProfile = {
          ...userProfile,
          name: newOrder.customerName,
          phone: newOrder.customerPhone,
          address: newOrder.address,
          updatedAt: new Date().toISOString(),
        };
        setUserProfile(updatedProfile);
        saveCustomerProfileDb(updatedProfile);
      }
    },
    [userProfile]
  );

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      if (query) {
        return (
          p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        );
      }
      if (activeCategoryId === 'super-ofertas') {
        return !!p.originalPrice && p.originalPrice > p.price;
      }
      if (activeCategoryId === 'pequenos-precos') {
        return p.price <= 20.0 || p.category === 'pequenos-precos';
      }
      return p.category === activeCategoryId;
    });
  }, [products, searchQuery, activeCategoryId]);

  const cartCountByProduct = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => {
      map.set(item.product.id, (map.get(item.product.id) || 0) + item.quantity);
    });
    return map;
  }, [cart]);

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, i) => sum + i.totalPrice, 0), [cart]);

  // Link de comanda: tela do balcão, aberta a partir da mensagem do WhatsApp
  if (initialComanda !== null || new URLSearchParams(window.location.search).has('comanda')) {
    return (
      <Suspense fallback={<Splash label="Abrindo comanda..." />}>
        <ComandaPage comanda={initialComanda} />
      </Suspense>
    );
  }

  if (!authChecked) {
    return <Splash label="Carregando..." />;
  }

  if (isAdmin && firebaseUser) {
    return (
      <Suspense fallback={<Splash label="Abrindo painel..." />}>
        <AdminPanel
          adminName={firebaseUser.displayName || 'Administrador'}
          adminEmail={firebaseUser.email || ''}
          onLogout={() => signOut(auth)}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-20 selection:bg-orange-500 selection:text-black">
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        selectedNeighborhood={selectedNeighborhood}
        onOpenDeliveryCalculator={() => setIsDeliveryCalculatorOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCouponModal={() => setIsCouponModalOpen(true)}
        userProfile={userProfile}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 mt-4 space-y-8">
        <CategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={(id) => {
            setActiveCategoryId(id);
            setSearchQuery('');
          }}
        />

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 font-display">
            <span>
              {searchQuery
                ? `Resultados para "${searchQuery}"`
                : categories.find((c) => c.id === activeCategoryId)?.name}
            </span>
          </h2>
          {lastOrder && (
            <a
              href={lastOrder.comandaUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 px-3 py-1.5 rounded-full border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Comanda {lastOrder.displayId}</span>
            </a>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-[#141418] border border-zinc-800 rounded-3xl space-y-2">
            <p className="text-zinc-400 font-bold text-sm">
              Nenhum produto encontrado nesta categoria.
            </p>
            <p className="text-zinc-600 text-xs">Tente selecionar outra categoria ou limpar a busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartCountForProduct={cartCountByProduct.get(product.id) || 0}
                onSelect={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </main>

      {(STORE_INFO.instagramUrl || STORE_INFO.instagram) && (
        <a
          href={STORE_INFO.instagramUrl || `https://instagram.com/${STORE_INFO.instagram}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-[72px] right-5 z-40 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:scale-110 active:scale-95 text-white p-3.5 rounded-full shadow-2xl shadow-pink-500/40 transition-all transform flex items-center justify-center"
          title="Siga nosso Instagram"
        >
          <Instagram className="w-6 h-6" />
        </a>
      )}

      <a
        href={`https://wa.me/${STORE_INFO.whatsapp}?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20hamburgueria%20Poderoso%20Burguer.`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 bg-emerald-500 hover:bg-emerald-400 text-black p-3.5 rounded-full shadow-2xl shadow-emerald-500/40 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center"
        title="Falar no WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-current stroke-none" />
      </a>

      <ProductModal
        product={selectedProduct}
        products={products}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        neighborhoods={neighborhoods}
        selectedNeighborhood={selectedNeighborhood}
        onSelectNeighborhood={setSelectedNeighborhood}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        userProfile={userProfile}
      />

      <DeliveryCalculatorModal
        isOpen={isDeliveryCalculatorOpen}
        onClose={() => setIsDeliveryCalculatorOpen(false)}
        neighborhoods={neighborhoods}
        selectedNeighborhood={selectedNeighborhood}
        onSelectNeighborhood={setSelectedNeighborhood}
      />

      <OrderSuccessModal sentOrder={sentOrder} onClose={() => setSentOrder(null)} />

      <CouponModal isOpen={isCouponModalOpen} onClose={() => setIsCouponModalOpen(false)} />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={setUserProfile}
        userProfile={userProfile}
      />

      <FloatingCartBar
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <FluidCursor />
    </div>
  );
}

export default App;
