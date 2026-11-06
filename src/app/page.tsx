"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Hero } from "@/components/unicria/hero";
import { Benefits, Products } from "@/components/unicria/sections";
import { About, Contact } from "@/components/unicria/contact";
import { Navbar } from "@/components/unicria/navbar";
import { Footer, WhatsAppFloat } from "@/components/unicria/footer";
import { SaaSApp } from "@/components/saas/SaaSApp";

/**
 * / → Painel SaaS "Ana — Atendimento Unicria"
 * /?site=1 → Site público da loja Unicria
 */
function Router() {
  const params = useSearchParams();
  const isSite = params.get("site") === "1";

  if (isSite) {
    return (
      <div className="flex min-h-screen flex-col bg-navy-dark">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <Benefits />
          <Products />
          <About />
          <Contact />
        </main>
        <Footer />
        <WhatsAppFloat />
      </div>
    );
  }
  return <SaaSApp />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-navy-dark">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        </div>
      }
    >
      <Router />
    </Suspense>
  );
}
