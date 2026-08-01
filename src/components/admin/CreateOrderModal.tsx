import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingBag } from 'lucide-react';
import type { Product, Neighborhood, Order, PaymentMethod, CartItem } from '../../types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  neighborhoods: Neighborhood[];
  onCreateOrder: (order: Order) => void;
  initialOrder?: Order | null;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  neighborhoods,
  onCreateOrder,
  initialOrder,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState(initialOrder?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialOrder?.customerPhone || '');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState(
    initialOrder
      ? neighborhoods.find(n => n.name === initialOrder.address.neighborhood)?.id || ''
      : neighborhoods[0]?.id || ''
  );
  const [street] = useState(initialOrder?.address.street !== 'Venda Balcão / Retirada' ? (initialOrder?.address.street || '') : '');
  const [number] = useState(initialOrder?.address.number !== 'S/N' ? (initialOrder?.address.number || '') : '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialOrder?.paymentMethod || 'PIX');
  const [changeFor] = useState(initialOrder?.changeFor || '');
  
  const [discount, setDiscount] = useState<number>(initialOrder?.discount || 0);

  const [manualItems, setManualItems] = useState<CartItem[]>(initialOrder?.items || []);

  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [meatPoint] = useState('Ao ponto');

  const selectedNeighborhood = neighborhoods.find((n) => n.id === selectedNeighborhoodId);

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const newItem: CartItem = {
      id: `manual-item-${Date.now()}-${Math.random()}`,
      product: prod,
      quantity: qty,
      options: {
        meatPoint: prod.requiresMeatPoint ? meatPoint : undefined,
      },
      totalPrice: prod.price * qty,
    };

    setManualItems((prev) => [...prev, newItem]);
    setQty(1);
  };

  const handleRemoveItem = (id: string) => {
    setManualItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualItems.length === 0) {
      alert('Adicione pelo menos 1 item ao pedido.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Preencha o nome e o telefone do cliente.');
      return;
    }

    const subtotal = manualItems.reduce((s, i) => s + i.totalPrice, 0);
    const deliveryFee = selectedNeighborhood ? selectedNeighborhood.deliveryFee : 0;
    const total = Math.max(0, subtotal + deliveryFee - discount);

    const newOrder: Order = {
      id: initialOrder ? initialOrder.id : `#PB-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: initialOrder ? initialOrder.createdAt : new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      address: {
        street: street.trim() || (initialOrder ? initialOrder.address.street : 'Venda Balcão / Retirada'),
        number: number.trim() || (initialOrder ? initialOrder.address.number : 'S/N'),
        neighborhood: selectedNeighborhood?.name || (initialOrder ? initialOrder.address.neighborhood : 'Centro'),
        complement: initialOrder?.address.complement,
        reference: initialOrder?.address.reference,
      },
      paymentMethod,
      changeFor: paymentMethod === 'CASH' ? changeFor : undefined,
      items: manualItems,
      subtotal,
      deliveryFee,
      discount,
      total,
      status: initialOrder ? initialOrder.status : 'CONFIRMED',
      statusHistory: initialOrder ? initialOrder.statusHistory : [
        { status: 'ANALYSIS', timestamp: new Date().toISOString() },
        { status: 'CONFIRMED', timestamp: new Date().toISOString() },
      ],
    };

    onCreateOrder(newOrder);
    onClose();
  };

  const subtotal = manualItems.reduce((s, i) => s + i.totalPrice, 0);
  const deliveryFee = selectedNeighborhood ? selectedNeighborhood.deliveryFee : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-backdrop overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg bg-[#141418] border border-orange-500/40 rounded-3xl p-6 shadow-2xl space-y-5 my-auto animate-modal-pop"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            {initialOrder ? 'Editar Pedido' : 'Lançar Novo Pedido (Balcão / Telefone)'}
          </h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Nome do Cliente</label>
            <input
              type="text"
              placeholder="Ex: João Silva"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">WhatsApp / Telefone</label>
            <input
              type="tel"
              placeholder="73999998888"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="bg-[#18181d] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-bold text-white uppercase block">Adicionar Produtos ao Pedido</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white p-2 rounded-xl text-xs sm:col-span-2 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - R$ {p.price.toFixed(2).replace('.', ',')}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="w-16 bg-zinc-900 border border-zinc-700 text-white p-2 rounded-xl text-xs text-center font-bold"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-black text-xs px-3 rounded-xl flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {manualItems.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-400 uppercase block">Itens no Pedido:</span>
            {manualItems.map((item) => (
              <div key={item.id} className="bg-[#18181d] border border-zinc-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{item.quantity}x {item.product.name}</span>
                  {item.options?.meatPoint && <span className="text-[10px] text-orange-400 block">🥩 {item.options.meatPoint}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-orange-400">R$ {item.totalPrice.toFixed(2).replace('.', ',')}</span>
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-zinc-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Bairro / Taxa</label>
            <select
              value={selectedNeighborhoodId}
              onChange={(e) => setSelectedNeighborhoodId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:outline-none"
            >
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} (R$ {n.deliveryFee.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Forma de Pagamento</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:outline-none"
            >
              <option value="PIX">Pix ⚡</option>
              <option value="CARD">Cartão 💳</option>
              <option value="CASH">Dinheiro 💵</option>
            </select>
          </div>
        </div>

        <div className="bg-[#18181d] border border-zinc-800 p-4 rounded-2xl space-y-2 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Taxa de Entrega</span>
            <span>+R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-300">
            <span className="font-bold">Desconto (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-24 bg-zinc-900 border border-zinc-700 text-white p-1.5 rounded-lg text-xs text-right focus:outline-none"
            />
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
            <span className="font-bold text-zinc-300">Total do Pedido:</span>
            <span className="text-lg font-black text-orange-400">R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 rounded-xl text-xs font-black"
          >
            {initialOrder ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR E SALVAR PEDIDO'}
          </button>
        </div>
      </form>
    </div>
  );
};
