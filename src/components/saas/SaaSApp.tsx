"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessagesSquare,
  ShoppingCart,
  Package,
  Bot,
  Settings,
  LogOut,
  Loader2,
  Globe,
} from "lucide-react";
import { api } from "./helpers";
import { Login } from "./Login";
import { Dashboard } from "./Dashboard";
import { Conversas } from "./Conversas";
import { Vendas } from "./Vendas";
import { Produtos } from "./Produtos";
import { AnaIA } from "./AnaIA";
import { Configuracoes } from "./Configuracoes";

type View =
  | "dashboard"
  | "conversas"
  | "vendas"
  | "produtos"
  | "ana"
  | "config";

const NAV: { id: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "conversas", label: "Conversas", icon: MessagesSquare },
  { id: "vendas", label: "Vendas", icon: ShoppingCart },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "ana", label: "Ana IA", icon: Bot },
  { id: "config", label: "Configurações", icon: Settings },
];

interface Me {
  authenticated: boolean;
  user: { name: string; email: string };
  tenant: { name: string; plan: string; botEnabled: boolean };
}

export function SaaSApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api<Me>("/api/auth/me")
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setMe(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-dark">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!me?.authenticated) {
    return <Login onSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="flex min-h-screen bg-navy-dark text-white">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-navy-light/50 backdrop-blur lg:flex">
        <SidebarContent me={me} view={view} setView={setView} logout={logout} />
      </aside>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            className="absolute inset-y-0 left-0 flex w-60 flex-col border-r border-white/10 bg-navy-light"
          >
            <SidebarContent
              me={me}
              view={view}
              setView={(v) => {
                setView(v);
                setSidebarOpen(false);
              }}
              logout={logout}
            />
          </motion.aside>
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex min-h-screen flex-1 flex-col lg:ml-60">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-navy-dark/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <LayoutDashboard className="h-5 w-5" />
          </button>
          <span className="font-bold text-gold-gradient">Ana — Unicria</span>
          <div className="h-10 w-10" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {view === "dashboard" && <Dashboard />}
          {view === "conversas" && <Conversas />}
          {view === "vendas" && <Vendas />}
          {view === "produtos" && <Produtos />}
          {view === "ana" && <AnaIA />}
          {view === "config" && <Configuracoes />}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  me,
  view,
  setView,
  logout,
}: {
  me: Me;
  view: View;
  setView: (v: View) => void;
  logout: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-gold/60">
          { }
          <img
            src="/images/photo_1.jpg"
            alt="Unicria"
            className="h-full w-full object-cover"
          />
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold text-gold-gradient">Ana — Unicria</p>
          <p className="flex items-center gap-1.5 text-xs text-white/50">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                me.tenant.botEnabled ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            {me.tenant.botEnabled ? "Robô activo" : "Robô desligado"}
          </p>
        </div>
      </div>

      <nav aria-label="Navegação do painel" className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-gold/15 text-gold-light shadow-inner"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <a
          href="/?site=1"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition-all hover:bg-white/5 hover:text-white"
        >
          <Globe className="h-5 w-5" />
          Ver site público
        </a>
        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-sm font-medium text-white">{me.user.name}</p>
            {me.user.role && (
              <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-light">
                {me.user.role}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-white/40">{me.user.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300/80 transition-all hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </>
  );
}
