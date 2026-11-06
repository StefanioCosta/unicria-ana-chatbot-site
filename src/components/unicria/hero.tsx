"use client";

import { motion } from "framer-motion";
import { MapPin, Truck, Users, MessageCircle } from "lucide-react";
import { WhatsAppIcon } from "./icons";
import { SITE, whatsappLink, DEFAULT_MESSAGE } from "@/lib/site-data";

const STATS = [
  { icon: Users, value: `${SITE.followers}+`, label: "Seguidores no Facebook" },
  { icon: Truck, value: "Todo o país", label: "Entregas em Angola" },
  { icon: MessageCircle, value: "WhatsApp", label: "Atendimento directo" },
];

export function Hero() {
  return (
    <section
      id="inicio"
      aria-label="Apresentação Unicria"
      className="relative flex min-h-screen items-center overflow-hidden bg-navy-dark pt-16"
    >
      {/* Background decorations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full border border-gold/15" />
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full border border-gold/10" />
        {/* Cover photo texture */}
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-luminosity"
          style={{
            backgroundImage: "url(/images/cover.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:gap-8 lg:px-8">
        {/* Text content */}
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5"
          >
            <MapPin className="h-4 w-4 text-gold" aria-hidden="true" />
            <span className="text-sm font-medium text-gold-light">
              Vendas de Produtos On-line em Angola 🇦🇴
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          >
            <span className="text-gold-gradient bg-size-200 animate-shine">Unicria</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl lg:mx-0"
          >
            Tudo o que você precisa, com{" "}
            <strong className="font-semibold text-gold-light">
              qualidade
            </strong>{" "}
            e{" "}
            <strong className="font-semibold text-gold-light">
              entrega rápida
            </strong>
            . Enviamos para Luanda e todo o país. 🛒
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <a
              href={whatsappLink(DEFAULT_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 text-base font-semibold text-white shadow-lg shadow-[#25D366]/25 transition-all hover:scale-[1.03] hover:shadow-xl sm:w-auto"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Falar no WhatsApp
            </a>
            <a
              href="#produtos"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gold/50 bg-white/5 px-7 text-base font-semibold text-gold-light backdrop-blur transition-all hover:bg-gold/15 sm:w-auto"
            >
              Ver produtos
            </a>
          </motion.div>

          {/* Stats */}
          <motion.dl
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm lg:text-left"
              >
                <s.icon
                  className="mx-auto mb-2 h-5 w-5 text-gold lg:mx-0"
                  aria-hidden="true"
                />
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-lg font-bold text-white">{s.value}</dd>
                <dd className="text-xs text-white/60">{s.label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Logo showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="order-1 flex justify-center lg:order-2"
        >
          <div className="animate-float relative">
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-gold/30 via-transparent to-gold/20 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-[2rem] border border-gold/30 shadow-2xl shadow-black/50">
              { }
              <img
                src={SITE.logo}
                alt="Logotipo oficial da Unicria — sacola dourada sobre fundo azul marinho"
                width={720}
                height={720}
                className="h-64 w-64 object-cover sm:h-80 sm:w-80 lg:h-[380px] lg:w-[380px]"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/40 bg-navy px-5 py-2 shadow-xl">
              <span className="text-sm font-semibold text-gold-light">
                🇦🇴 Luanda · Todo o país
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.a
        href="#produtos"
        aria-label="Rolar para produtos"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/50 transition-colors hover:text-gold md:flex"
      >
        <span className="text-xs font-medium">Deslize</span>
        <div className="flex h-9 w-6 items-start justify-center rounded-full border-2 border-current p-1.5">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="h-2 w-1 rounded-full bg-gold"
          />
        </div>
      </motion.a>
    </section>
  );
}
