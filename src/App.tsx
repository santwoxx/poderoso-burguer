import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CategoryTabs } from './components/CategoryTabs';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { DeliveryCalculatorModal } from './components/DeliveryCalculatorModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { CouponModal } from './components/CouponModal';
import { LoginModal } from './components/LoginModal';
import { FluidCursor } from './components/FluidCursor';
import { FloatingCartBar } from './components/FloatingCartBar';
import { AdminLayout } from './components/admin/AdminLayout';
import type {
  Product,
  Category,
  Neighborhood,
  Order,
  CartItem,
  CartItemOption,
  OrderStatus,
  StoreSettings,
} from './types';
import {
  subscribeOrders,
  subscribeProducts,
  subscribeNeighborhoods,
  saveOrderDb,
  updateOrderStatusDb,
  deleteOrderDb,
  saveProductsDb,
  saveNeighborhoodsDb,
  subscribeSettings,
  saveSettingsDb,
} from './services/firebaseService';
import { loadCategories, deriveCustomersFromOrders, loadSettings } from './utils/storage';
import { STORE_INFO } from './data/mockData';
import { MessageCircle, Clock, UserCheck } from 'lucide-react';

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

export function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories] = useState<Category[]>(loadCategories);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProfile, setUserProfile] = useState<{
    email: string;
    name: string;
    cpf?: string;
    phone?: string;
  } | null>(null);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || 'pequenos-precos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDeliveryCalculatorOpen, setIsDeliveryCalculatorOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [trackerOrder, setTrackerOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(loadSettings());

  // Subscribe to Firestore Realtime updates
  useEffect(() => {
    const unsubOrders = subscribeOrders((liveOrders) => {
      setOrders(liveOrders);
      
      const urlParams = new URLSearchParams(window.location.search);
      const orderIdParam = urlParams.get('order');
      if (orderIdParam) {
        const found = liveOrders.find(o => o.id === `#${orderIdParam}` || o.id === orderIdParam);
        if (found) {
          setTrackerOrder(found);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    });
    const unsubProducts = subscribeProducts((liveProds) => setProducts(liveProds));
    const unsubNeighborhoods = subscribeNeighborhoods((liveNeighs) => {
      setNeighborhoods(liveNeighs);
      if (!selectedNeighborhood && liveNeighs.length > 0) {
        const saoPedro = liveNeighs.find((n) => n.id === 'nb-sao-pedro' && n.isActive);
        setSelectedNeighborhood(saoPedro || liveNeighs.find((n) => n.isActive) || liveNeighs[0]);
      }
    });
    const unsubSettings = subscribeSettings((liveSettings) => {
      setSettings(liveSettings);
      if (liveSettings.theme === 'light') {
        document.body.classList.add('light');
      } else {
        document.body.classList.remove('light');
      }
    });

    return () => {
      unsubOrders();
      unsubProducts();
      unsubNeighborhoods();
      unsubSettings();
    };
  }, []);

  const customers = deriveCustomersFromOrders(orders);

  const handleToggleAdminClick = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      if (userProfile?.email.toLowerCase() === 'emanoelcarmo00@gmail.com') {
        setIsAdminAuth(true);
        setIsAdmin(true);
      } else {
        setIsLoginModalOpen(true);
      }
    }
  };

  const handleAddToCart = (product: Product, quantity: number, options: CartItemOption) => {
    const addonsTotal = options.addons ? options.addons.reduce((sum, a) => sum + a.price, 0) : 0;
    const unitPrice = product.price + addonsTotal;
    const totalPrice = unitPrice * quantity;

    const newItem: CartItem = {
      id: `cart-item-${Date.now()}-${Math.random()}`,
      product,
      quantity,
      options,
      totalPrice,
    };

    setCart((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const addonsTotal = item.options?.addons
            ? item.options.addons.reduce((sum, a) => sum + a.price, 0)
            : 0;
          const unitPrice = item.product.price + addonsTotal;
          return {
            ...item,
            quantity: newQty,
            totalPrice: unitPrice * newQty,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleClearCart = () => setCart([]);

  const handleOrderPlaced = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    saveOrderDb(newOrder);
    setTrackerOrder(newOrder);
  };

  const handleCreateManualOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    saveOrderDb(newOrder);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const history = o.statusHistory || [];
          return {
            ...o,
            status,
            statusHistory: [...history, { status, timestamp: new Date().toISOString() }],
          };
        }
        return o;
      })
    );
    updateOrderStatusDb(orderId, status);
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    deleteOrderDb(orderId);
  };

  const handleSaveNeighborhoods = (newNeighborhoods: Neighborhood[]) => {
    setNeighborhoods(newNeighborhoods);
    saveNeighborhoodsDb(newNeighborhoods);
  };

  const handleSaveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveProductsDb(newProducts);
  };

  const filteredProducts = products.filter((p) => {
    let matchesCategory = searchQuery ? true : p.category === activeCategoryId;
    if (!searchQuery) {
      if (activeCategoryId === 'super-ofertas') {
        matchesCategory = !!p.originalPrice && p.originalPrice > p.price;
      } else if (activeCategoryId === 'pequenos-precos') {
        matchesCategory = p.price <= 20.00 || p.category === 'pequenos-precos';
      }
    }
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-20 selection:bg-orange-500 selection:text-black">
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        selectedNeighborhood={selectedNeighborhood}
        onOpenDeliveryCalculator={() => setIsDeliveryCalculatorOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        isAdmin={isAdmin}
        onToggleAdmin={handleToggleAdminClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCouponModal={() => setIsCouponModalOpen(true)}
        userProfile={userProfile}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {isAdmin ? (
        <AdminLayout
          orders={orders}
          neighborhoods={neighborhoods}
          customers={customers}
          products={products}
          categories={categories}
          settings={settings}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onCreateOrder={handleCreateManualOrder}
          onDeleteOrder={handleDeleteOrder}
          onSaveNeighborhoods={handleSaveNeighborhoods}
          onSaveProducts={handleSaveProducts}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            if (newSettings.theme === 'light') {
              document.body.classList.add('light');
            } else {
              document.body.classList.remove('light');
            }
            saveSettingsDb(newSettings);
          }}
          onCloseAdmin={() => setIsAdmin(false)}
        />
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 mt-4 space-y-8">
          <CategoryTabs
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={(id) => {
              setActiveCategoryId(id);
              setSearchQuery('');
            }}
          />

          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 font-display">
              <span>
                {searchQuery
                  ? `Resultados para "${searchQuery}"`
                  : categories.find((c) => c.id === activeCategoryId)?.name}
              </span>
            </h2>
            {trackerOrder && (
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setTrackerOrder(trackerOrder);
                }}
                className="bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 px-3 py-1.5 rounded-full border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 animate-pulse"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Acompanhar Pedido {trackerOrder.id}</span>
              </button>
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
              {filteredProducts.map((product) => {
                const prodCount = cart
                  .filter((item) => item.product.id === product.id)
                  .reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cartCountForProduct={prodCount}
                    onSelect={setSelectedProduct}
                  />
                );
              })}
            </div>
          )}
        </main>
      )}

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
      />

      <DeliveryCalculatorModal
        isOpen={isDeliveryCalculatorOpen}
        onClose={() => setIsDeliveryCalculatorOpen(false)}
        neighborhoods={neighborhoods}
        selectedNeighborhood={selectedNeighborhood}
        onSelectNeighborhood={setSelectedNeighborhood}
      />

      <OrderTrackerModal
        order={trackerOrder}
        onClose={() => setTrackerOrder(null)}
      />

      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(profile) => {
          setUserProfile(profile);
          if (profile.email.toLowerCase() === 'emanoelcarmo00@gmail.com') {
            setIsAdminAuth(true);
            setIsAdmin(true);
          }
        }}
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
