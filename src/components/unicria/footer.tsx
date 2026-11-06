"use client";

import Link from "next/link";
import { Facebook, Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { WhatsAppIcon } from "./icons";
import { SITE, whatsappLink, DEFAULT_MESSAGE } from "@/lib/site-data";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-navy-dark border-t border-white/10 pb-24 pt-14 md:pb-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <Link href="#inicio" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-gold/60">
                { }
                <img
                  src={SITE.logo}
                  alt="Logotipo Unicria"
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="text-xl font-bold text-gold-gradient">
                Unicria
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              {SITE.tagline}. {SITE.description}
            </p>
          </div>

          <nav aria-label="Links do rodapé">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
              Navegação
            </h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "#inicio", label: "Início" },
                { href: "#produtos", label: "Produtos" },
                { href: "#sobre", label: "Sobre" },
                { href: "#contacto", label: "Contacto" },
              ].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-white/60 transition-colors hover:text-gold"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
              Contacto
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li>{SITE.phoneDisplay}</li>
              <li>{SITE.location}</li>
              <li>
                <a
                  href={SITE.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-gold"
                >
                  <Facebook className="h-4 w-4" aria-hidden="true" />
                  Facebook — Unicria
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/50">
            © {year} Unicria. Todos os direitos reservados.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-white/50">
            Feito com
            <Heart
              className="h-3.5 w-3.5 fill-gold text-gold"
              aria-hidden="true"
            />
            para Angola 🇦🇴
          </p>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  return (
    <motion.a
      href={whatsappLink(DEFAULT_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Unicria no WhatsApp"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/40 transition-transform hover:scale-110 md:bottom-6 md:right-6"
    >
      {/* Pulse ring */}
      <span
        aria-hidden="true"
        className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20"
      />
      <WhatsAppIcon className="relative h-7 w-7" />
    </motion.a>
  );
}
