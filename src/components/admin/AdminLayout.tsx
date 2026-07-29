import React, { useState } from 'react';
import { ClipboardList, MapPin, Users, Package, Clock, ShieldCheck, TrendingUp, Sun, Moon } from 'lucide-react';
import type { Order, Neighborhood, Customer, Product, Category, OrderStatus, StoreSettings } from '../../types';
import { OrdersManager } from './OrdersManager';
import { DeliveryManager } from './DeliveryManager';
import { CustomersManager } from './CustomersManager';
import { ProductsManager } from './ProductsManager';

interface AdminLayoutProps {
  orders: Order[];
  neighborhoods: Neighborhood[];
  customers: Customer[];
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onCreateOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onSaveNeighborhoods: (neighborhoods: Neighborhood[]) => void;
  onSaveProducts: (products: Product[]) => void;
  onUpdateSettings: (settings: StoreSettings) => void;
  onCloseAdmin: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  orders,
  neighborhoods,
  customers,
  products,
  categories,
  settings,
  onUpdateOrderStatus,
  onCreateOrder,
  onDeleteOrder,
  onSaveNeighborhoods,
  onSaveProducts,
  onUpdateSettings,
  onCloseAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'delivery' | 'customers' | 'products'>('orders');

  // Revenue Metrics Calculations (Gross Sales)
  const now = new Date();
  const validOrders = orders.filter((o) => o.status !== 'CANCELED');

  // Today
  const todaySales = validOrders
    .filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, o) => sum + o.total, 0);

  // This Week (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekSales = validOrders
    .filter((o) => new Date(o.createdAt) >= sevenDaysAgo)
    .reduce((sum, o) => sum + o.total, 0);

  // This Month
  const monthSales = validOrders
    .filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + o.total, 0);

  // This Year
  const yearSales = validOrders
    .filter((o) => new Date(o.createdAt).getFullYear() === now.getFullYear())
    .reduce((sum, o) => sum + o.total, 0);

  // All time
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'ANALYSIS' || o.status === 'CONFIRMED' || o.status === 'DELIVERY'
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Admin Header & Revenue Cards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30 flex items-center gap-1.5 w-max">
              <ShieldCheck className="w-4 h-4" />
              Painel Administrativo
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 font-display">
              Gestão Poderoso Burguer
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-3 py-2 rounded-xl border border-zinc-700 transition-colors flex-1 sm:flex-none justify-center"
              title="Alternar Tema da Loja"
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-orange-400" />}
              <span className="inline">Modo {settings.theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </button>
            <button
              onClick={onCloseAdmin}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2 rounded-xl border border-zinc-700 transition-colors flex-1 sm:flex-none justify-center"
            >
              ← <span className="hidden sm:inline">Voltar para o Cardápio</span><span className="sm:hidden">Voltar</span>
            </button>
          </div>
        </div>

        {/* Detailed Gross Revenue Breakdown */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              Faturamento de Vendas (Valor Bruto)
            </h3>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Sincronizado Ao Vivo</span>
          </div>

          <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-5 gap-3 font-num overflow-x-auto no-scrollbar pb-2 snap-x">
            {/* Today */}
            <div className="bg-zinc-800 border border-zinc-800/90 rounded-2xl p-3.5 space-y-1 min-w-[140px] snap-start shrink-0">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Hoje</span>
              <span className="text-base sm:text-lg font-black text-orange-400">
                R$ {todaySales.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Week */}
            <div className="bg-zinc-800 border border-zinc-800/90 rounded-2xl p-3.5 space-y-1 min-w-[140px] snap-start shrink-0">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Esta Semana</span>
              <span className="text-base sm:text-lg font-black text-white">
                R$ {weekSales.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Month */}
            <div className="bg-zinc-800 border border-zinc-800/90 rounded-2xl p-3.5 space-y-1 min-w-[140px] snap-start shrink-0">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Este Mês</span>
              <span className="text-base sm:text-lg font-black text-white">
                R$ {monthSales.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Year */}
            <div className="bg-zinc-800 border border-zinc-800/90 rounded-2xl p-3.5 space-y-1 min-w-[140px] snap-start shrink-0">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Este Ano</span>
              <span className="text-base sm:text-lg font-black text-white">
                R$ {yearSales.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* All time */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-3.5 space-y-1 min-w-[140px] sm:col-span-4 lg:col-span-1 snap-start shrink-0">
              <span className="text-[10px] font-bold text-orange-400 uppercase block">Total Geral</span>
              <span className="text-base sm:text-lg font-black text-orange-400">
                R$ {totalRevenue.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Operational Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
          <div className="bg-zinc-800 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-semibold">Pedidos em Andamento</p>
              <h3 className="text-base font-black text-white font-num">{pendingOrdersCount} pedidos</h3>
            </div>
          </div>

          <div className="bg-zinc-800 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-semibold">Clientes Cadastrados</p>
              <h3 className="text-base font-black text-white font-num">{customers.length} clientes</h3>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto no-scrollbar pt-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Pedidos ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'delivery'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Fretes por Bairro ({neighborhoods.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'customers'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'products'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Cardápio ({products.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <OrdersManager
          orders={orders}
          products={products}
          neighborhoods={neighborhoods}
          onUpdateStatus={onUpdateOrderStatus}
          onCreateOrder={onCreateOrder}
          onDeleteOrder={onDeleteOrder}
        />
      )}

      {activeTab === 'delivery' && (
        <DeliveryManager
          neighborhoods={neighborhoods}
          onSaveNeighborhoods={onSaveNeighborhoods}
        />
      )}

      {activeTab === 'customers' && <CustomersManager customers={customers} />}

      {activeTab === 'products' && (
        <ProductsManager
          products={products}
          categories={categories}
          onSaveProducts={onSaveProducts}
        />
      )}
    </div>
  );
};
