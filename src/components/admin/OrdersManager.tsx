import React, { useState } from 'react';
import { Phone, MapPin, Clock, MessageSquare, Check, Bike, Sparkles, X, Eye, Plus, Trash2, Send } from 'lucide-react';
import type { Order, OrderStatus, Product, Neighborhood } from '../../types';
import { STATUS_LABELS, generateAdminStatusWhatsAppLink } from '../../utils/whatsapp';
import { CreateOrderModal } from './CreateOrderModal';

interface OrdersManagerProps {
  orders: Order[];
  products: Product[];
  neighborhoods: Neighborhood[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCreateOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  products,
  neighborhoods,
  onUpdateStatus,
  onCreateOrder,
  onUpdateOrder,
  onDeleteOrder,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [activeModalOrder, setActiveModalOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Optional status notification modal state
  const [pendingNotifyOrder, setPendingNotifyOrder] = useState<{ order: Order; newStatus: OrderStatus } | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (selectedFilter === 'ALL') return true;
    return o.status === selectedFilter;
  });

  const handleStatusClick = (order: Order, newStatus: OrderStatus) => {
    // 1. Immediately update status in Firestore/database (so customer live screen updates instantly)
    onUpdateStatus(order.id, newStatus);
    
    // 2. Open optional prompt modal to decide if WhatsApp message should be dispatched
    setPendingNotifyOrder({ order, newStatus });
  };

  const handleConfirmWhatsAppNotify = (sendWhatsApp: boolean) => {
    if (pendingNotifyOrder && sendWhatsApp) {
      const waLink = generateAdminStatusWhatsAppLink(pendingNotifyOrder.order, pendingNotifyOrder.newStatus);
      window.open(waLink, '_blank');
    }
    setPendingNotifyOrder(null);
  };

  const handleDelete = (orderId: string) => {
    if (window.confirm(`Tem certeza que deseja apagar o pedido ${orderId} do sistema?`)) {
      onDeleteOrder(orderId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141418] border border-zinc-800 rounded-2xl p-4">
        <div>
          <h3 className="font-extrabold text-white text-base">Controle Total de Pedidos</h3>
          <p className="text-zinc-400 text-xs mt-0.5">
            Gerencie status, lance vendas de balcão e exclua pedidos.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingOrder(null);
            setIsCreateModalOpen(true);
          }}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Lançar Pedido Manual (Balcão)</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedFilter === 'ALL'
              ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
          }`}
        >
          Todos ({orders.length})
        </button>

        {(['ANALYSIS', 'CONFIRMED', 'DELIVERY', 'COMPLETED', 'CANCELED'] as OrderStatus[]).map((st) => {
          const count = orders.filter((o) => o.status === st).length;
          const info = STATUS_LABELS[st];
          return (
            <button
              key={st}
              onClick={() => setSelectedFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                selectedFilter === st
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-md text-[10px]">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-[#141418] border border-zinc-800/80 rounded-2xl">
          <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-400 font-bold text-sm">Nenhum pedido encontrado nesta categoria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const statusInfo = STATUS_LABELS[order.status];

            return (
              <div
                key={order.id}
                className="bg-[#141418] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-white font-num">{order.id}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${statusInfo.color}`}
                      >
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.label}</span>
                      </span>
                      <button
                        onClick={() => {
                          setEditingOrder(order);
                          setIsCreateModalOpen(true);
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-orange-500/20 text-zinc-500 hover:text-orange-400 rounded-lg transition-colors"
                        title="Editar Pedido"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-1.5 bg-zinc-900 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                        title="Excluir Pedido"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 space-y-1">
                    <p className="font-bold text-zinc-200 text-sm">{order.customerName}</p>
                    <p className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-orange-400" />
                      <span>{order.customerPhone}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      <span>
                        {order.address.neighborhood} • {order.address.street}, Nº {order.address.number}
                      </span>
                    </p>
                    <p className="flex items-center gap-1 text-zinc-500 text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-[#18181d] border border-zinc-800/80 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="font-bold text-zinc-300 text-[11px] uppercase tracking-wider mb-1">
                    {order.items.length} item(ns):
                  </div>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-zinc-300">
                      <span>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-bold text-orange-400 font-num">
                        R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-zinc-800 flex justify-between font-black text-white text-sm">
                    <span>Total ({order.paymentMethod})</span>
                    <span className="text-orange-400 font-num">
                      R$ {order.total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Status change actions */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <div className="grid grid-cols-2 gap-1.5">
                    {order.status !== 'CONFIRMED' && order.status !== 'COMPLETED' && order.status !== 'CANCELED' && (
                      <button
                        onClick={() => handleStatusClick(order, 'CONFIRMED')}
                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar</span>
                      </button>
                    )}

                    {order.status !== 'DELIVERY' && order.status !== 'COMPLETED' && order.status !== 'CANCELED' && (
                      <button
                        onClick={() => handleStatusClick(order, 'DELIVERY')}
                        className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Saiu p/ Entrega</span>
                      </button>
                    )}

                    {order.status !== 'COMPLETED' && order.status !== 'CANCELED' && (
                      <button
                        onClick={() => handleStatusClick(order, 'COMPLETED')}
                        className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Concluir</span>
                      </button>
                    )}

                    {order.status !== 'CANCELED' && order.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleStatusClick(order, 'CANCELED')}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>

                  {/* Explicit WhatsApp button */}
                  <button
                    onClick={() => {
                      const link = generateAdminStatusWhatsAppLink(order, order.status);
                      window.open(link, '_blank');
                    }}
                    className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar Status Atual no WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setActiveModalOrder(order)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Detalhes Completos</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Dispatch Choice Prompt Modal */}
      {pendingNotifyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#141418] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/30">
              <Send className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-white text-lg">Status Atualizado no Sistema!</h3>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                O pedido <strong className="text-orange-400">{pendingNotifyOrder.order.id}</strong> agora está{' '}
                <strong className="text-white">{STATUS_LABELS[pendingNotifyOrder.newStatus].label}</strong> (já atualizado ao vivo na tela do cliente).
              </p>
              <p className="text-zinc-500 text-[11px] mt-2">
                Deseja enviar também uma mensagem no WhatsApp de <strong>{pendingNotifyOrder.order.customerName}</strong>?
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleConfirmWhatsAppNotify(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Sim, Abrir WhatsApp</span>
              </button>

              <button
                onClick={() => handleConfirmWhatsAppNotify(false)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs py-3 rounded-xl transition-colors"
              >
                Não, Apenas Manter no Sistema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detailed View */}
      {activeModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#141418] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-black text-white text-lg">Detalhes do Pedido {activeModalOrder.id}</h3>
              <button
                onClick={() => setActiveModalOrder(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#18181d] border border-zinc-800/80 rounded-2xl p-4 space-y-2 text-xs text-zinc-300">
              <p><span className="font-bold text-white">Cliente:</span> {activeModalOrder.customerName}</p>
              <p><span className="font-bold text-white">WhatsApp:</span> {activeModalOrder.customerPhone}</p>
              <p><span className="font-bold text-white">Bairro:</span> {activeModalOrder.address.neighborhood}</p>
              <p><span className="font-bold text-white">Endereço:</span> {activeModalOrder.address.street}, Nº {activeModalOrder.address.number}</p>
              {activeModalOrder.address.complement && <p><span className="font-bold text-white">Complemento:</span> {activeModalOrder.address.complement}</p>}
              {activeModalOrder.address.reference && <p><span className="font-bold text-white">Referência:</span> {activeModalOrder.address.reference}</p>}
              <p><span className="font-bold text-white">Forma de Pagamento:</span> {activeModalOrder.paymentMethod} {activeModalOrder.changeFor ? `(Troco para R$ ${activeModalOrder.changeFor})` : ''}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase">Itens Solicitados</h4>
              {activeModalOrder.items.map((item, i) => (
                <div key={i} className="bg-[#18181d] border border-zinc-800 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span className="text-orange-400 font-num">R$ {item.totalPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {item.options?.meatPoint && <p className="text-orange-400 text-[11px]">🥩 Ponto: {item.options.meatPoint}</p>}
                  {item.options?.addons && item.options.addons.length > 0 && (
                    <p className="text-zinc-400 text-[11px]">
                      Adicionais: {item.options.addons.map(a => `${a.name} (+R$ ${a.price.toFixed(2)})`).join(', ')}
                    </p>
                  )}
                  {item.options?.observation && <p className="text-zinc-400 text-[11px] italic">Obs: "{item.options.observation}"</p>}
                </div>
              ))}
            </div>

            <div className="bg-[#18181d] border border-zinc-800 p-4 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>R$ {activeModalOrder.subtotal.toFixed(2).replace('.', ',')}</span></div>
              <div className="flex justify-between text-zinc-400"><span>Taxa de Entrega</span><span>+R$ {activeModalOrder.deliveryFee.toFixed(2).replace('.', ',')}</span></div>
              <div className="flex justify-between font-black text-white text-sm pt-2 border-t border-zinc-800">
                <span>Total Geral</span>
                <span className="text-orange-400 font-num">R$ {activeModalOrder.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateOrderModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingOrder(null);
          }}
          products={products}
          neighborhoods={neighborhoods}
          initialOrder={editingOrder}
          onCreateOrder={(order) => {
            if (editingOrder) {
              onUpdateOrder(order);
            } else {
              onCreateOrder(order);
            }
          }}
        />
      )}
    </div>
  );
};
