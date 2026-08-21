import React, { useEffect, useMemo, useState } from 'react';
import { X, Trash2, ShoppingBag, MapPin, CreditCard, DollarSign, QrCode, MessageSquare, Ticket, Check } from 'lucide-react';
import type { CartItem, CustomerProfile, Neighborhood, PaymentMethod, Order } from '../types';
import { COUPONS } from '../data/mockData';
import { formatBRL } from '../utils/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  neighborhoods: Neighborhood[];
  selectedNeighborhood: Neighborhood | null;
  onSelectNeighborhood: (n: Neighborhood) => void;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
  userProfile: CustomerProfile | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  neighborhoods,
  selectedNeighborhood,
  onSelectNeighborhood,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  userProfile,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [changeFor, setChangeFor] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Pré-preenche os dados do cliente salvo (Google login) assim que o carrinho abre
  useEffect(() => {
    if (!isOpen || !userProfile) return;
    setCustomerName((prev) => prev || userProfile.name || '');
    setCustomerPhone((prev) => prev || userProfile.phone || '');
    setStreet((prev) => prev || userProfile.address?.street || '');
    setNumber((prev) => prev || userProfile.address?.number || '');
    setComplement((prev) => prev || userProfile.address?.complement || '');
    setReference((prev) => prev || userProfile.address?.reference || '');
  }, [isOpen, userProfile]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.totalPrice, 0), [items]);
  const deliveryFee = selectedNeighborhood ? selectedNeighborhood.deliveryFee : 0;
  const discount = appliedCoupon ? Math.round(subtotal * appliedCoupon.percent) / 100 : 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  if (!isOpen) return null;

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const coupon = COUPONS[code];
    if (!coupon) {
      setAppliedCoupon(null);
      setCouponError('Cupom inválido ou expirado.');
      return;
    }
    setAppliedCoupon({ code, percent: coupon.percent });
    setCouponError('');
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }

    if (!selectedNeighborhood) {
      alert('Por favor, selecione seu bairro para calcular a taxa de entrega.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor, preencha seu nome e telefone.');
      return;
    }

    if (customerPhone.replace(/\D/g, '').length < 10) {
      alert('Informe um WhatsApp válido com DDD (ex: 73999998888).');
      return;
    }

    if (selectedNeighborhood.deliveryFee > 0 && (!street.trim() || !number.trim())) {
      alert('Por favor, preencha o nome da rua e o número para a entrega.');
      return;
    }

    const newOrder: Order = {
      id: crypto.randomUUID(),
      displayId: `#PB-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      address: {
        street: street.trim() || 'Retirada no Balcão',
        number: number.trim() || 'S/N',
        neighborhood: selectedNeighborhood.name,
        complement: complement.trim(),
        reference: reference.trim(),
      },
      paymentMethod,
      changeFor: paymentMethod === 'CASH' ? changeFor.trim() : undefined,
      items,
      subtotal,
      deliveryFee,
      discount,
      couponCode: appliedCoupon?.code,
      total,
    };

    // O pedido segue para o WhatsApp da loja (com o link da comanda para impressão);
    // o que fica registrado no Painel é o cadastro do cliente.
    onOrderPlaced(newOrder);
    onClearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-backdrop">
      <div className="relative w-full max-w-md bg-[#121215] border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-drawer-slide">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#16161a]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            <h2 className="font-black text-white text-base font-display">Seu Pedido</h2>
            <span className="bg-orange-500/20 text-orange-400 font-bold text-xs px-2 py-0.5 rounded-full border border-orange-500/30 font-num">
              {items.length} itens
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-zinc-400 text-sm font-medium">Seu carrinho está vazio</p>
              <p className="text-zinc-600 text-xs">Adicione deliciosos burgers do cardápio!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase">
                <span>Itens selecionados</span>
                <button
                  onClick={onClearCart}
                  className="text-red-400 hover:text-red-300 font-medium"
                >
                  Esvaziar
                </button>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#18181d] border border-zinc-800/80 rounded-2xl p-3 flex gap-3 items-center animate-fade-in"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-14 h-14 rounded-xl object-cover bg-zinc-900 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-xs truncate">{item.product.name}</h4>
                    {item.options?.meatPoint && (
                      <p className="text-[10px] text-orange-400">🥩 {item.options.meatPoint}</p>
                    )}
                    {item.options?.comboSelections && (
                      <div className="text-[10px] text-zinc-300 mt-0.5 space-y-0.5">
                        <p>🍔 {item.options.comboSelections.burger1}</p>
                        <p>🍔 {item.options.comboSelections.burger2}</p>
                        <p>🍟 {item.options.comboSelections.side}</p>
                      </div>
                    )}
                    {item.options?.addons && item.options.addons.length > 0 && (
                      <p className="text-[10px] text-zinc-400 truncate">
                        + {item.options.addons.map((a) => a.name).join(', ')}
                      </p>
                    )}
                    <span className="text-orange-400 font-extrabold text-xs mt-1 block font-num">
                      R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-num">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-1 text-zinc-400 hover:text-white"
                      >
                        -
                      </button>
                      <span className="px-1 font-bold text-white text-xs">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 text-zinc-400 hover:text-white"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5 pt-2">
              <div className="bg-[#18181d] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Bairro & Frete
                  </span>
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-600/20 px-2 py-0.5 rounded-full">
                    Obrigatório
                  </span>
                </div>

                <select
                  value={selectedNeighborhood?.id || ''}
                  onChange={(e) => {
                    const found = neighborhoods.find((n) => n.id === e.target.value);
                    if (found) onSelectNeighborhood(found);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 p-3 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  required
                >
                  <option value="">-- Selecione o seu Bairro --</option>
                  {neighborhoods
                    .filter((n) => n.isActive)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} - R$ {n.deliveryFee.toFixed(2).replace('.', ',')} ({n.estimatedTime})
                      </option>
                    ))}
                </select>

                {selectedNeighborhood && selectedNeighborhood.deliveryFee > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <input
                      type="text"
                      placeholder="Rua / Avenida *"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Número *"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Complemento (ex: Apt 102)"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Ponto de Referência"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="bg-[#18181d] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-white uppercase block">
                  Seus Dados para o Pedido
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Seu Nome Completo *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp para contato (ex: 73999998888) *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#18181d] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-white uppercase block">
                  Forma de Pagamento
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'PIX'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-[10px]">Pix</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'CARD'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-[10px]">Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-[10px]">Dinheiro</span>
                  </button>
                </div>

                {paymentMethod === 'CASH' && (
                  <input
                    type="text"
                    placeholder="Precisa de troco para quanto? (ex: 50,00)"
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                  />
                )}
              </div>

              <div className="bg-[#18181d] border border-zinc-800/80 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-orange-500" />
                  Cupom de Desconto
                </span>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 min-w-0">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {appliedCoupon.code} • -{appliedCoupon.percent}% no subtotal
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponInput('');
                      }}
                      className="text-[11px] font-bold text-zinc-400 hover:text-red-400 shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Digite o código (ex: PODEROSO10)"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 p-2.5 rounded-xl text-xs uppercase focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="bg-zinc-800 hover:bg-orange-500 hover:text-black text-zinc-200 font-bold px-4 rounded-xl text-xs transition-colors shrink-0"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-red-400 font-semibold">{couponError}</p>}
                  </>
                )}
              </div>
            </form>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 bg-[#16161a] border-t border-zinc-800 space-y-3 font-num">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Desconto ({appliedCoupon?.code})</span>
                  <span>-{formatBRL(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Taxa de Entrega ({selectedNeighborhood?.name || 'Não selecionado'})</span>
                <span className="text-orange-400 font-semibold">+{formatBRL(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-zinc-800">
                <span>Total a Pagar</span>
                <span className="text-orange-400 text-base">{formatBRL(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>ENVIAR PEDIDO NO WHATSAPP</span>
            </button>

            <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
              O pedido abre no WhatsApp da loja com o link da comanda. A confirmação vem por lá. 🍔
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
