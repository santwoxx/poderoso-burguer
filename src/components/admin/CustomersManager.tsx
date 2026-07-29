import React, { useState } from 'react';
import { Users, Phone, MessageSquare, Search, Calendar } from 'lucide-react';
import type { Customer } from '../../types';
import { formatPhoneForWhatsapp } from '../../utils/whatsapp';

interface CustomersManagerProps {
  customers: Customer[];
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({ customers }) => {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141418] border border-zinc-800 rounded-2xl p-5">
        <div>
          <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Controle de Clientes
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            Total de <span className="text-orange-400 font-bold">{customers.length}</span> clientes cadastrados no sistema.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 pl-9 pr-3 py-2 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#141418] border border-zinc-800 rounded-2xl">
          <p className="text-zinc-400 font-bold text-sm">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => {
            const formattedPhone = formatPhoneForWhatsapp(customer.phone);
            const waLink = `https://wa.me/${formattedPhone}`;

            return (
              <div
                key={customer.id}
                className="bg-[#141418] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-white text-base">{customer.name}</h4>
                    <span className="bg-orange-500/20 text-orange-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-orange-500/30">
                      {customer.ordersCount} pedido(s)
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-orange-400" />
                    <span>{customer.phone}</span>
                  </p>

                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Último pedido: {new Date(customer.lastOrderDate).toLocaleDateString('pt-BR')}</span>
                  </p>
                </div>

                <div className="bg-[#18181d] border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Total Gasto:</span>
                  <span className="text-sm font-black text-orange-400">
                    R$ {customer.totalSpent.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chamar no WhatsApp</span>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
