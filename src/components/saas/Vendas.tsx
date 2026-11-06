"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api, formatKz, dateTime } from "./helpers";

interface Sale {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddr: string | null;
  productName: string;
  valueKz: number;
  status: string;
  lossReason: string | null;
  kikoloStatus: string;
  kikoloProtocol: string | null;
  createdAt: string;
}

const KIKOLO_LABEL: Record<string, string> = {
  pendente: "Pendente",
  simulado: "Simulado",
  agendado: "Agendado ✓",
  erro: "Erro",
};

export function Vendas() {
  const [tab, setTab] = useState<"fechada" | "perdida">("fechada");
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api<{ sales: Sale[]; totalFechado: number }>(
        `/api/sales?status=${tab}`
      );
      setSales(data.sales);
      setTotal(data.totalFechado);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function markPerdida(sale: Sale) {
    const motivo = window.prompt("Motivo da perda (opcional):") || "";
    try {
      await api(`/api/sales/${sale.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "perdida", lossReason: motivo || "Sem motivo indicado" }),
      });
      toast({ title: "Venda marcada como perdida" });
      await load();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha",
        variant: "destructive",
      });
    }
  }

  async function reabrir(sale: Sale) {
    try {
      await api(`/api/sales/${sale.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "fechada", lossReason: null }),
      });
      toast({ title: "Venda reaberta como fechada ✓" });
      await load();
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="text-sm text-white/50">
            Fechadas, perdidas e o valor total do teu negócio
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-gold/40 hover:text-gold-light"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> Total fechado
          </div>
          <p className="mt-2 text-3xl font-bold">{formatKz(total)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Wallet className="h-4 w-4 text-gold" /> Nº de vendas nesta lista
          </div>
          <p className="mt-2 text-3xl font-bold">{sales.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("fechada")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
            tab === "fechada"
              ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40"
              : "bg-white/5 text-white/50 hover:text-white"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" /> Fechadas
        </button>
        <button
          type="button"
          onClick={() => setTab("perdida")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
            tab === "perdida"
              ? "bg-red-500/20 text-red-300 ring-1 ring-red-400/40"
              : "bg-white/5 text-white/50 hover:text-white"
          }`}
        >
          <XCircle className="h-4 w-4" /> Perdidas
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-gold" />
          </div>
        ) : sales.length === 0 ? (
          <p className="p-10 text-center text-sm text-white/40">
            {tab === "fechada"
              ? "Ainda sem vendas fechadas. Usa o simulador de conversas para ver a Ana a fechar uma!"
              : "Sem vendas perdidas. Boa! 🎉"}
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Kikolo</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sales.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-white/5">
                  <td className="px-5 py-4">
                    <p className="font-medium">{s.customerName}</p>
                    <p className="text-xs text-white/40">{s.customerPhone}</p>
                    {s.customerAddr && (
                      <p className="mt-0.5 max-w-[220px] truncate text-xs text-white/30" title={s.customerAddr}>
                        📍 {s.customerAddr}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">{s.productName}</td>
                  <td className="px-5 py-4 font-semibold text-gold-light">
                    {s.valueKz ? formatKz(s.valueKz) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        s.kikoloStatus === "agendado" || s.kikoloStatus === "simulado"
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : s.kikoloStatus === "erro"
                            ? "border-red-400/30 bg-red-500/10 text-red-300"
                            : "border-white/15 bg-white/5 text-white/50"
                      }`}
                      title={s.kikoloProtocol || undefined}
                    >
                      {KIKOLO_LABEL[s.kikoloStatus] || s.kikoloStatus}
                      {s.kikoloProtocol ? ` · ${s.kikoloProtocol}` : ""}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-white/50">
                    {dateTime(s.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    {s.status === "perdida" ? (
                      <div>
                        {s.lossReason && (
                          <p className="mb-1 max-w-[160px] truncate text-xs text-white/40" title={s.lossReason}>
                            {s.lossReason}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => reabrir(s)}
                          className="text-xs font-medium text-emerald-300 hover:underline"
                        >
                          Reabrir
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markPerdida(s)}
                        className="text-xs font-medium text-red-300/80 hover:text-red-300 hover:underline"
                      >
                        Marcar perdida
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
