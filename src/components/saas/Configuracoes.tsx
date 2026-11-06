"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Phone, Globe, KeyRound, PlugZap, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "./helpers";

interface TenantConfig {
  name: string;
  botNumber: string | null;
  whatsappProvider: string;
  whatsappPhoneId: string | null;
  whatsappToken: string | null;
  whatsappVerifyTok: string;
  uazapiUrl: string | null;
  kikoloUrl: string | null;
  kikoloEmail: string | null;
  kikoloPassword: string | null;
}

export function Configuracoes() {
  const [c, setC] = useState<TenantConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingKikolo, setTestingKikolo] = useState(false);
  const [kikoloResult, setKikoloResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    api<{ tenant: TenantConfig }>("/api/settings").then((d) => setC(d.tenant));
  }, []);

  async function save() {
    if (!c) return;
    setSaving(true);
    try {
      await api("/api/settings", { method: "PATCH", body: JSON.stringify(c) });
      toast({ title: "Configurações guardadas ✓" });
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

  async function testKikolo() {
    setTestingKikolo(true);
    setKikoloResult(null);
    try {
      await save();
      const res = await api<{ ok: boolean; mode: string; message: string }>(
        "/api/kikolo/test",
        { method: "POST" }
      );
      setKikoloResult(res.message);
      toast({
        title: res.ok ? "Teste concluído ✓" : "Teste com problemas",
        description: res.message,
      });
    } catch (err) {
      setKikoloResult(err instanceof Error ? err.message : "Falha no teste");
    } finally {
      setTestingKikolo(false);
    }
  }

  if (!c) {
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
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-white/50">
            Liga o WhatsApp, a Kikolo Online e o número do bot
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy-dark transition-all hover:bg-gold-light disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar tudo
        </button>
      </div>

      {/* Número do bot + notificações */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5 text-gold" />
          <p className="font-semibold">Número do bot / do lojista</p>
        </div>
        <p className="mb-3 text-xs text-white/40">
          Número de WhatsApp que a Ana usa. As notificações de &quot;🔔 Venda Fechada!&quot;
          são enviadas para cá quando o agendamento acontece.
        </p>
        <input
          value={c.botNumber || ""}
          onChange={(e) => setC({ ...c, botNumber: e.target.value })}
          className="input"
          placeholder="+244950418496"
        />
      </section>

      {/* WhatsApp */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-gold" />
          <p className="font-semibold">Ligação WhatsApp</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: "cloud_api", label: "WhatsApp Cloud API (Meta) — oficial" },
            { id: "uazapi", label: "UAZAPI — QR Code" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setC({ ...c, whatsappProvider: opt.id })}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                c.whatsappProvider === opt.id
                  ? "bg-gold/20 text-gold-light ring-1 ring-gold/40"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {c.whatsappProvider === "cloud_api" ? (
          <div className="space-y-4">
            <Field label="Phone Number ID (Meta)">
              <input
                value={c.whatsappPhoneId || ""}
                onChange={(e) => setC({ ...c, whatsappPhoneId: e.target.value })}
                className="input"
                placeholder="ex: 123456789012345"
              />
            </Field>
            <Field label="Access Token permanente (Meta)">
              <input
                value={c.whatsappToken || ""}
                onChange={(e) => setC({ ...c, whatsappToken: e.target.value })}
                className="input"
                type="password"
                placeholder="EAAG..."
              />
            </Field>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="URL da instância UAZAPI">
              <input
                value={c.uazapiUrl || ""}
                onChange={(e) => setC({ ...c, uazapiUrl: e.target.value })}
                className="input"
                placeholder="https://teu-servidor-uazapi.com"
              />
            </Field>
            <Field label="Token da instância">
              <input
                value={c.whatsappToken || ""}
                onChange={(e) => setC({ ...c, whatsappToken: e.target.value })}
                className="input"
                type="password"
                placeholder="Token da instância UAZAPI"
              />
            </Field>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-gold/20 bg-gold/5 p-4">
          <p className="mb-2 text-xs font-semibold text-gold-light">
            Webhook para configurar no Meta (ou fornecedor):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-navy-dark/70 px-3 py-2 text-xs text-white/80">
              {origin}/api/webhook/whatsapp
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${origin}/api/webhook/whatsapp`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              aria-label="Copiar URL do webhook"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-navy-dark/70 px-3 py-2 text-xs text-white/80">
              Verify token: {c.whatsappVerifyTok}
            </code>
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            Subscreve o campo &quot;messages&quot; no Meta for Developers. Sem
            credenciais preenchidas, o sistema funciona em modo demo (simulador).
          </p>
        </div>
      </section>

      {/* Kikolo */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-gold" />
          <p className="font-semibold">Conta Kikolo Online (automação Playwright)</p>
        </div>
        <div className="space-y-4">
          <Field label="URL da página de login da Kikolo">
            <input
              value={c.kikoloUrl || ""}
              onChange={(e) => setC({ ...c, kikoloUrl: e.target.value })}
              className="input"
              placeholder="https://kikolo.online/login"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email da conta">
              <input
                value={c.kikoloEmail || ""}
                onChange={(e) => setC({ ...c, kikoloEmail: e.target.value })}
                className="input"
                placeholder="oteu@email.ao"
              />
            </Field>
            <Field label="Senha">
              <input
                type="password"
                value={c.kikoloPassword || ""}
                onChange={(e) => setC({ ...c, kikoloPassword: e.target.value })}
                className="input"
                placeholder="••••••••"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={testKikolo}
            disabled={testingKikolo}
            className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/25 disabled:opacity-60"
          >
            {testingKikolo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlugZap className="h-4 w-4" />
            )}
            Testar ligação à Kikolo
          </button>
          {kikoloResult && (
            <p className="max-w-md text-xs text-white/60">{kikoloResult}</p>
          )}
        </div>
        <p className="mt-3 text-[11px] text-white/40">
          ⚠️ Sem credenciais, os agendamentos correm em modo SIMULAÇÃO (protocolo
          gerado no painel). Com credenciais, o worker Playwright loga na Kikolo e
          agenda com Nome, Telefone e Morada. Confirma os Termos de Serviço da
          Kikolo antes de activar. As credenciais devem ser encriptadas em
          produção.
        </p>
      </section>

      <style jsx global>{`
        .input {
          height: 2.75rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          padding: 0 0.75rem;
          font-size: 0.875rem;
          color: #fff;
          outline: none;
        }
        .input:focus {
          border-color: rgba(201, 164, 92, 0.5);
        }
        .input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/60">
        {label}
      </label>
      {children}
    </div>
  );
}
