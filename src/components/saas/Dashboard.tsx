"use client";

import { useEffect, useState } from "react";
import {
  MessagesSquare,
  CheckCircle2,
  XCircle,
  Wallet,
  TrendingUp,
  Power,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api, formatKz, timeAgo, STATUS_LABEL, STATUS_CLASS } from "./helpers";

interface Stats {
  conversasHoje: number;
  vendasFechadas: number;
  vendasPerdidas: number;
  valorTotal: number;
  valorPerdido: number;
  winRate: number;
  grafico: { dia: string; valor: number }[];
  ultimasConversas: {
    id: string;
    customerName: string | null;
    customerPhone: string;
    status: string;
    lastMessageAt: string;
  }[];
  bot: { botEnabled: boolean; botNumber: string | null; plan: string } | null;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  async function load() {
    try {
      setStats(await api<Stats>("/api/stats"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  async function toggleBot() {
    setToggling(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ botEnabled: !stats?.bot?.botEnabled }),
      });
      await load();
    } finally {
      setToggling(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  const kpis = [
    {
      label: "Conversas hoje",
      value: String(stats.conversasHoje),
      icon: MessagesSquare,
      color: "text-blue-300",
      bg: "bg-blue-500/10",
    },
    {
      label: "Vendas fechadas",
      value: String(stats.vendasFechadas),
      icon: CheckCircle2,
      color: "text-emerald-300",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Vendas perdidas",
      value: String(stats.vendasPerdidas),
      icon: XCircle,
      color: "text-red-300",
      bg: "bg-red-500/10",
    },
    {
      label: "Valor total vendido",
      value: formatKz(stats.valorTotal),
      icon: Wallet,
      color: "text-gold-light",
      bg: "bg-gold/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-white/50">
            Desempenho da Ana e da tua loja em tempo real
          </p>
        </div>
        <button
          type="button"
          onClick={toggleBot}
          disabled={toggling}
          className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all ${
            stats.bot?.botEnabled
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
              : "border-red-400/40 bg-red-500/15 text-red-300 hover:bg-red-500/25"
          }`}
        >
          {toggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Power className="h-4 w-4" />
          )}
          {stats.bot?.botEnabled ? "Robô ACTIVO — clique para desligar" : "Robô DESLIGADO — clique para ligar"}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-gold/30"
          >
            <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl ${k.bg}`}>
              <k.icon className={`h-6 w-6 ${k.color}`} />
            </div>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="mt-0.5 text-sm text-white/50">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Win rate + gráfico */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <TrendingUp className="h-4 w-4 text-gold" />
            Taxa de conversão
          </div>
          <p className="mt-3 text-4xl font-bold text-gold-gradient">
            {stats.winRate}%
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-all"
              style={{ width: `${stats.winRate}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-white/40">
            {stats.vendasFechadas} fechadas de {stats.vendasFechadas + stats.vendasPerdidas} oportunidades
          </p>
          <p className="mt-1 text-xs text-white/40">
            Valor perdido: {formatKz(stats.valorPerdido)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
          <p className="mb-4 text-sm text-white/60">Vendas dos últimos 7 dias (Kz)</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.grafico}>
                <XAxis
                  dataKey="dia"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                  }
                />
                <Tooltip
                  formatter={(value) => [formatKz(Number(value)), "Vendido"]}
                  contentStyle={{
                    background: "#1f3050",
                    border: "1px solid rgba(201,164,92,0.3)",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                  {stats.grafico.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.valor > 0 ? "#c9a45c" : "rgba(255,255,255,0.08)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Últimas conversas */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="mb-4 text-sm text-white/60">Últimas conversas</p>
        <div className="divide-y divide-white/5">
          {stats.ultimasConversas.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold-light">
                  {(c.customerName || c.customerPhone).charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {c.customerName || "Cliente"}
                  </p>
                  <p className="text-xs text-white/40">{c.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${STATUS_CLASS[c.status] || ""}`}
                >
                  {STATUS_LABEL[c.status] || c.status}
                </span>
                <span className="text-xs text-white/40">
                  {timeAgo(c.lastMessageAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
