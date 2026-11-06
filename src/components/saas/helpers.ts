"use client";

/** Helpers partilhados do painel */

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Erro ${res.status}`);
  }
  return data as T;
}

export function formatKz(valor: number): string {
  if (!valor) return "—";
  return (
    new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(valor) +
    " Kz"
  );
}

export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function dateTime(date: string | Date): string {
  return new Date(date).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  agendada: "Agendada",
  perdida: "Perdida",
  humana: "Humano a atender",
};

export const STATUS_CLASS: Record<string, string> = {
  aberta: "bg-blue-500/15 text-blue-300 border-blue-400/30",
  agendada: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  perdida: "bg-red-500/15 text-red-300 border-red-400/30",
  humana: "bg-amber-500/15 text-amber-300 border-amber-400/30",
};
