"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Power, Clock, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "./helpers";

interface TenantSettings {
  name: string;
  botEnabled: boolean;
  anaPrompt: string;
  knowledge: string;
  openHour: number;
  closeHour: number;
}

export function AnaIA() {
  const [s, setS] = useState<TenantSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ tenant: TenantSettings }>("/api/settings").then((d) =>
      setS(d.tenant)
    );
  }, []);

  async function save() {
    if (!s) return;
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          anaPrompt: s.anaPrompt,
          knowledge: s.knowledge,
          openHour: s.openHour,
          closeHour: s.closeHour,
          botEnabled: s.botEnabled,
        }),
      });
      toast({ title: "Configurações da Ana guardadas ✓" });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao guardar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!s) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ana IA</h1>
          <p className="text-sm text-white/50">
            O cérebro da tua atendente — personalidade, horário e conhecimento
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy-dark transition-all hover:bg-gold-light disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar tudo
        </button>
      </div>

      {/* Estado do robô */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              s.botEnabled ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
            }`}
          >
            <Power className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold">
              {s.botEnabled ? "Ana LIGADA" : "Ana DESLIGADA"}
            </p>
            <p className="text-xs text-white/50">
              {s.botEnabled
                ? "Ela responde sozinha a todos os clientes"
                : "Todas as mensagens esperam atendimento humano"}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={s.botEnabled}
          onClick={() => setS({ ...s, botEnabled: !s.botEnabled })}
          className={`relative h-8 w-14 rounded-full transition-colors ${
            s.botEnabled ? "bg-emerald-500" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
              s.botEnabled ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Horário */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gold" />
          <p className="font-semibold">Horário de atendimento (Hora de Luanda)</p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/60">Abre às</label>
            <input
              type="number"
              min={0}
              max={23}
              value={s.openHour}
              onChange={(e) => setS({ ...s, openHour: Number(e.target.value) })}
              className="h-11 w-28 rounded-xl border border-white/10 bg-white/5 px-3 text-center text-white focus:border-gold/50 focus:outline-none"
            />
          </div>
          <span className="pb-3 text-white/40">até</span>
          <div>
            <label className="mb-1.5 block text-xs text-white/60">Fecha às</label>
            <input
              type="number"
              min={1}
              max={24}
              value={s.closeHour}
              onChange={(e) => setS({ ...s, closeHour: Number(e.target.value) })}
              className="h-11 w-28 rounded-xl border border-white/10 bg-white/5 px-3 text-center text-white focus:border-gold/50 focus:outline-none"
            />
          </div>
          <p className="pb-3 text-xs text-white/40">
            Fora deste horário, a Ana usa a mensagem de encerramento e pede nome +
            produto para responder logo às 07h.
          </p>
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="mb-1 font-semibold">Prompt da Ana (personalidade + regras)</p>
        <p className="mb-3 text-xs text-white/40">
          Define quem ela é, como fala e as 20 respostas de estilo. Edita à
          vontade — as alterações valem para as próximas mensagens.
        </p>
        <textarea
          value={s.anaPrompt}
          onChange={(e) => setS({ ...s, anaPrompt: e.target.value })}
          rows={14}
          className="w-full rounded-xl border border-white/10 bg-navy-dark/60 p-4 font-mono text-xs leading-relaxed text-white/90 focus:border-gold/50 focus:outline-none"
        />
      </div>

      {/* Base de conhecimento */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-1 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gold" />
          <p className="font-semibold">Base de conhecimento</p>
        </div>
        <p className="mb-3 text-xs text-white/40">
          Pagamentos, prazos e custos de entrega, políticas de troca/devolução,
          e quando transferir para atendimento humano.
        </p>
        <textarea
          value={s.knowledge}
          onChange={(e) => setS({ ...s, knowledge: e.target.value })}
          rows={10}
          className="w-full rounded-xl border border-white/10 bg-navy-dark/60 p-4 font-mono text-xs leading-relaxed text-white/90 focus:border-gold/50 focus:outline-none"
        />
      </div>
    </div>
  );
}
