import React, { useEffect, useState } from 'react';
import { ShoppingBag, MapPin, Ticket, ShieldCheck, Store, Search, Download } from 'lucide-react';
import { STORE_INFO } from '../data/mockData';
import type { Neighborhood } from '../types';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  selectedNeighborhood: Neighborhood | null;
  onOpenDeliveryCalculator: () => void;
  onOpenCart: () => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCouponModal: () => void;
  userProfile: { email: string; name: string } | null;
  onOpenLoginModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  cartTotal,
  selectedNeighborhood,
  onOpenDeliveryCalculator,
  onOpenCart,
  isAdmin,
  onToggleAdmin,
  searchQuery,
  onSearchChange,
  onOpenCouponModal,
  userProfile,
  onOpenLoginModal,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstallPWA(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <header className="relative w-full bg-zinc-950">
      <div className="bg-zinc-900 border-b border-zinc-800/80 px-4 py-2 text-xs text-zinc-300">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onOpenDeliveryCalculator}
            className="flex items-center gap-2 hover:text-orange-400 transition-colors bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-700/60 font-medium"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span>
              {selectedNeighborhood
                ? `Entrega: ${selectedNeighborhood.name} (R$ ${selectedNeighborhood.deliveryFee.toFixed(2).replace('.', ',')})`
                : 'Calcular taxa e tempo de entrega'}
            </span>
          </button>

          <div className="relative flex-1 max-w-sm hidden sm:block">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full bg-zinc-900/90 text-zinc-200 placeholder-zinc-500 pl-9 pr-3 py-1.5 rounded-full border border-zinc-800 focus:border-orange-500 focus:outline-none text-xs transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
            {canInstallPWA && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-full border border-emerald-500/30 font-bold transition-all text-xs animate-bounce"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar App</span>
              </button>
            )}

            <button
              onClick={onOpenCouponModal}
              className="flex items-center gap-1.5 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 px-3 py-1.5 rounded-full border border-orange-500/30 transition-colors font-medium"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Cupons</span>
            </button>

            {userProfile?.email.toLowerCase() === 'emanoelcarmo00@gmail.com' ? (
              <button
                onClick={onToggleAdmin}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all font-bold text-xs ${
                  isAdmin
                    ? 'bg-orange-500 text-black border-orange-400 shadow-lg shadow-orange-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 hover:border-orange-500/50'
                }`}
              >
                {isAdmin ? (
                  <>
                    <Store className="w-3.5 h-3.5" />
                    <span>Ver Cardápio</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                    <span>Painel Admin</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 hover:border-orange-500/50"
              >
                <Store className="w-3.5 h-3.5 text-orange-400" />
                <span>{userProfile ? 'Meu Perfil' : 'Entrar'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {!isAdmin && (
        <>
          <div className="relative h-48 sm:h-60 w-full overflow-hidden">
            <img
              src={STORE_INFO.bannerUrl}
              alt="Banner Poderoso Burguer"
              className="w-full h-full object-cover filter brightness-[0.55] contrast-125 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-black/50" />
          </div>

          <div className="max-w-6xl mx-auto px-4 -mt-16 sm:-mt-24 relative z-10">
            <div className="bg-zinc-900 border border-zinc-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-lg flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="relative shrink-0">
                  <img
                    src={STORE_INFO.logoUrl}
                    alt={STORE_INFO.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-orange-500 shadow-xl shadow-orange-500/20"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-black font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full border border-zinc-900">
                    ● Aberto
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 justify-center sm:justify-start font-display">
                    {STORE_INFO.name.toUpperCase()}
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1 flex items-center gap-3 justify-center sm:justify-start font-medium">
                    <span>🛵 Entrega: {STORE_INFO.prepTime}</span>
                    <span>•</span>
                    <span>Min: R$ {STORE_INFO.minOrder.toFixed(2).replace('.', ',')}</span>
                  </p>
                  <p className="text-xs text-orange-400 mt-1.5 font-bold">
                    📍 Hamburgueria Artesanal • Atendimento Rápido e Entregas
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenCart}
                className="relative w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-center gap-3 transition-all transform active:scale-95 hover:scale-105"
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-orange-600 font-extrabold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="text-left font-num">
                  <div className="text-[10px] text-orange-100 uppercase tracking-wider font-semibold">Seu Carrinho</div>
                  <div className="text-sm font-black">R$ {cartTotal.toFixed(2).replace('.', ',')}</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
