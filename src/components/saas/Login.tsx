"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircleHeart, Loader2 } from "lucide-react";
import { api } from "./helpers";

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("admin@unicria.ao");
  const [password, setPassword] = useState("unicria2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-dark p-4">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-navy-light/80 p-8 shadow-2xl backdrop-blur"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full ring-2 ring-gold/60">
            { }
            <img
              src="/images/photo_1.jpg"
              alt="Unicria"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">
            <span className="text-gold-gradient">Ana</span> — Atendimento Unicria
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Painel de gestão do chatbot com IA
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-white/70"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none"
              placeholder="o.teu@email.ao"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-white/70"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold text-base font-semibold text-navy-dark transition-all hover:bg-gold-light disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MessageCircleHeart className="h-5 w-5" />
            )}
            Entrar no painel
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          Demo: admin@unicria.ao · unicria2026
        </p>
      </motion.div>
    </div>
  );
}
