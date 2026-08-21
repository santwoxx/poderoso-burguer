import React, { useMemo, useState } from 'react';
import { Wallet, ClipboardList, TrendingUp, Users, Repeat, Printer, BarChart3, Trophy, Info } from 'lucide-react';
import type { CustomerProfile } from '../types';
import { formatBRL } from '../utils/whatsapp';

interface AdminFinanceTabProps {
  customers: CustomerProfile[];
}

type Period = 'today' | '7d' | '30d' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  all: 'Tudo',
};

// Par categórico validado para o fundo escuro do painel (#141418):
// ΔE 10.1 em protanopia, 28.8 em visão normal, contraste ≥ 3:1
const COLOR_NEW = '#ea580c'; // laranja — cadastros novos
const COLOR_ACTIVE = '#059669'; // verde — clientes que pediram

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isWithinPeriod(date: Date, period: Period): boolean {
  if (period === 'all') return true;
  const now = new Date();
  if (period === 'today') return isSameDay(date, now);
  const days = period === '7d' ? 7 : 30;
  return date >= startOfDay(new Date(now.getTime() - (days - 1) * 86400000));
}

const isGuest = (c: CustomerProfile) => c.source === 'guest' || c.uid.startsWith('g_');

export const AdminFinanceTab: React.FC<AdminFinanceTabProps> = ({ customers }) => {
  const [period, setPeriod] = useState<Period>('7d');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const stats = useMemo(() => {
    const revenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const ordersCount = customers.reduce((sum, c) => sum + (c.ordersCount || 0), 0);
    const returning = customers.filter((c) => (c.ordersCount || 0) >= 2).length;
    const guests = customers.filter(isGuest).length;

    const activeInPeriod = customers.filter(
      (c) => c.lastOrderDate && isWithinPeriod(new Date(c.lastOrderDate), period)
    );
    const newInPeriod = customers.filter(
      (c) => c.createdAt && isWithinPeriod(new Date(c.createdAt), period)
    );

    return {
      revenue,
      ordersCount,
      averageTicket: ordersCount > 0 ? revenue / ordersCount : 0,
      total: customers.length,
      returning,
      returningPct: customers.length > 0 ? (returning / customers.length) * 100 : 0,
      guests,
      registered: customers.length - guests,
      activeInPeriod: activeInPeriod.length,
      revenueInPeriod: activeInPeriod.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
      newInPeriod: newInPeriod.length,
    };
  }, [customers, period]);

  // Últimos 7 dias — sempre fixo, independente do filtro de período acima
  const dailyChart = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const date = startOfDay(new Date(Date.now() - (6 - i) * 86400000));
      const created = customers.filter((c) => c.createdAt && isSameDay(new Date(c.createdAt), date)).length;
      const active = customers.filter(
        (c) => c.lastOrderDate && isSameDay(new Date(c.lastOrderDate), date)
      ).length;
      return { date, created, active };
    });
    const max = Math.max(1, ...days.map((d) => Math.max(d.created, d.active)));
    return { days, max };
  }, [customers]);

  const topCustomers = useMemo(
    () =>
      [...customers]
        .filter((c) => (c.totalSpent || 0) > 0)
        .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, 8),
    [customers]
  );

  const topMax = Math.max(1, ...topCustomers.map((c) => c.totalSpent || 0));

  return (
    <div className="space-y-4">
      <div className="print-only mb-2">
        <h1 className="text-xl font-black">Poderoso Burguer — Relatório de Clientes</h1>
        <p className="text-xs mt-0.5">
          Período: {PERIOD_LABELS[period]} • Gerado em {new Date().toLocaleString('pt-BR')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border ${
                period === p
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-3 py-2 rounded-xl text-xs font-bold shrink-0"
        >
          <Printer className="w-3.5 h-3.5" />
          Imprimir Relatório
        </button>
      </div>

      <div className="print-area space-y-4">
        <div className="report-card bg-orange-500/10 border border-orange-500/25 rounded-2xl p-3 flex gap-2 text-[11px] text-orange-300 leading-relaxed">
          <Info className="w-4 h-4 shrink-0 mt-px" />
          <span>
            Os números vêm dos pedidos <strong>enviados pelo site</strong> ao WhatsApp da loja. Pedidos que o
            cliente desistiu de mandar na conversa, ou feitos direto no balcão, não entram aqui.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="report-card bg-[#141418] border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Valor Acumulado
            </p>
            <p className="text-lg font-black text-white font-num mt-1">{formatBRL(stats.revenue)}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Somando todos os pedidos enviados</p>
          </div>
          <div className="report-card bg-[#141418] border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" /> Pedidos Enviados
            </p>
            <p className="text-lg font-black text-white font-num mt-1">{stats.ordersCount}</p>
          </div>
          <div className="report-card bg-[#141418] border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Ticket Médio
            </p>
            <p className="text-lg font-black text-white font-num mt-1">{formatBRL(stats.averageTicket)}</p>
          </div>
          <div className="report-card bg-[#141418] border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Clientes Cadastrados
            </p>
            <p className="text-lg font-black text-white font-num mt-1">{stats.total}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {stats.registered} com login • {stats.guests} sem login
            </p>
          </div>
          <div className="report-card bg-[#141418] border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <Repeat className="w-3.5 h-3.5 text-emerald-400" /> Clientes Recorrentes
            </p>
            <p className="text-lg font-black text-emerald-400 font-num mt-1">{stats.returning}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {stats.returningPct.toFixed(0)}% pediram mais de uma vez
            </p>
          </div>
          <div className="report-card bg-[#141418] border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Ativos ({PERIOD_LABELS[period]})
            </p>
            <p className="text-lg font-black text-white font-num mt-1">{stats.activeInPeriod}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{stats.newInPeriod} cadastro(s) novo(s)</p>
          </div>
        </div>

        {/* Movimento diário: cadastros novos vs clientes que pediram */}
        <div className="report-card bg-[#141418] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              Movimento — Últimos 7 dias
            </h4>
            <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_NEW }} />
                Cadastros novos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_ACTIVE }} />
                Pediram
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-36 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-t border-zinc-800/60 w-full" />
              ))}
            </div>

            <div className="relative h-36 flex items-end gap-2 sm:gap-3">
              {dailyChart.days.map((d, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-full flex items-end justify-center gap-0.5 relative"
                  onMouseEnter={() => setHoveredDay(idx)}
                  onMouseLeave={() => setHoveredDay((h) => (h === idx ? null : h))}
                >
                  {hoveredDay === idx && (
                    <div className="no-print absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-[10px] whitespace-nowrap shadow-xl z-10">
                      <p className="font-bold text-white mb-1">
                        {d.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                      <p className="text-zinc-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm" style={{ background: COLOR_NEW }} />
                        {d.created} cadastro(s) novo(s)
                      </p>
                      <p className="text-zinc-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm" style={{ background: COLOR_ACTIVE }} />
                        {d.active} cliente(s) pediram
                      </p>
                    </div>
                  )}
                  <div
                    className="w-2.5 sm:w-3.5 rounded-t-[4px] transition-all"
                    style={{
                      height: `${(d.created / dailyChart.max) * 100}%`,
                      minHeight: d.created > 0 ? 2 : 0,
                      background: COLOR_NEW,
                    }}
                  />
                  <div className="w-0.5 shrink-0" />
                  <div
                    className="w-2.5 sm:w-3.5 rounded-t-[4px] transition-all"
                    style={{
                      height: `${(d.active / dailyChart.max) * 100}%`,
                      minHeight: d.active > 0 ? 2 : 0,
                      background: COLOR_ACTIVE,
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 sm:gap-3 mt-1.5">
              {dailyChart.days.map((d, idx) => (
                <span key={idx} className="flex-1 text-center text-[9px] text-zinc-500 font-semibold">
                  {d.date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ranking: quem mais gastou */}
        <div className="report-card bg-[#141418] border border-zinc-800 rounded-2xl p-4">
          <h4 className="font-bold text-white text-sm flex items-center gap-1.5 mb-3">
            <Trophy className="w-4 h-4 text-orange-400" />
            Melhores Clientes
          </h4>

          {topCustomers.length === 0 ? (
            <p className="text-xs text-zinc-500">Nenhum pedido registrado ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {topCustomers.map((c) => (
                <div key={c.uid}>
                  <div className="flex items-center justify-between text-xs mb-1 gap-3">
                    <span className="text-zinc-300 font-semibold truncate">
                      {c.name}
                      <span className="text-zinc-500 font-normal"> • {c.ordersCount || 0} pedido(s)</span>
                    </span>
                    <span className="text-orange-400 font-bold font-num whitespace-nowrap">
                      {formatBRL(c.totalSpent || 0)}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-900 rounded-full overflow-hidden report-track">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${((c.totalSpent || 0) / topMax) * 100}%`, background: COLOR_NEW }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
