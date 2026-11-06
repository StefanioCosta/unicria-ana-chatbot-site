"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Facebook,
  Clock,
  Truck,
  BadgeCheck,
} from "lucide-react";
import { WhatsAppIcon } from "./icons";
import { SITE, whatsappLink, DEFAULT_MESSAGE } from "@/lib/site-data";

export function About() {
  return (
    <section
      id="sobre"
      aria-label="Sobre a Unicria"
      className="scroll-mt-16 bg-cream py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto w-full max-w-md"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-gold/25 to-navy/10 blur-xl"
            />
            <div className="relative overflow-hidden rounded-[1.75rem] border-4 border-white shadow-2xl shadow-navy/20">
              { }
              <img
                src={SITE.logo}
                alt="Logotipo da Unicria"
                width={720}
                height={720}
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="absolute -right-3 -top-3 rounded-2xl border border-gold/30 bg-navy px-5 py-3 text-center shadow-xl">
              <span className="block text-2xl font-bold text-gold-gradient">
                {SITE.followers}+
              </span>
              <span className="text-xs text-white/70">seguidores</span>
            </div>
          </motion.div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
              Quem somos
            </span>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
              Sobre a <span className="text-gold-gradient">Unicria</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-navy/75">
              A <strong>Unicria</strong> é uma loja de vendas on-line angolana
              que nasceu para facilitar o acesso a produtos de qualidade em
              todo o país. Trabalhamos com uma curadoria cuidadosa de artigos —
              com destaque para smartphones e electrónica — para que cada
              cliente receba exactamente o que pediu, no prazo combinado.
            </p>
            <p className="mt-4 text-base leading-relaxed text-navy/75">
              O nosso atendimento é pessoal e directo: tudo acontece pelo
              WhatsApp, desde a escolha do produto até à confirmação da
              entrega. Sem complicações, sem burocracia — apenas uma
              experiência de compra simples, segura e rápida, de Luanda para
              todo o território nacional.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                "Curadoria de produtos com qualidade garantida",
                "Entregas em Luanda e envio para todo o país",
                "Atendimento humano e directo no WhatsApp",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <BadgeCheck
                    className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-navy/85">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink(DEFAULT_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/25 transition-all hover:scale-[1.03] hover:shadow-xl"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Falar connosco
              </a>
              <a
                href={SITE.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-navy/20 bg-white px-6 text-sm font-semibold text-navy transition-all hover:border-navy/40 hover:bg-navy hover:text-white"
              >
                <Facebook className="h-5 w-5" />
                Seguir no Facebook
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const CONTACT_CARDS = [
  {
    icon: WhatsAppIcon,
    title: "WhatsApp",
    lines: [SITE.phoneDisplay, "Atendimento rápido e directo"],
    href: whatsappLink(DEFAULT_MESSAGE),
    cta: "Abrir conversa",
    external: true,
  },
  {
    icon: Facebook,
    title: "Facebook",
    lines: ["Unicria", `${SITE.followers} seguidores`],
    href: SITE.facebookUrl,
    cta: "Visitar página",
    external: true,
  },
  {
    icon: Truck,
    title: "Entregas",
    lines: ["Luanda e todo o país", "Porta a porta"],
    href: undefined,
    cta: undefined,
    external: false,
  },
];

export function Contact() {
  return (
    <section
      id="contacto"
      aria-label="Contacto da Unicria"
      className="relative scroll-mt-16 overflow-hidden bg-navy-dark py-20"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-gold">
            Estamos à disposição
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Fale <span className="text-gold-gradient">connosco</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Tem dúvidas sobre um produto ou quer encomendar? Escolha o canal
            mais cómodo para si — respondemos o mais rápido possível.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CONTACT_CARDS.map((c, i) => {
            const Icon = c.icon;
            const inner = (
              <>
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/30">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                <p className="mt-1 text-base font-medium text-gold-light">
                  {c.lines[0]}
                </p>
                <p className="mt-0.5 text-sm text-white/60">{c.lines[1]}</p>
                {c.cta && (
                  <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2 text-sm font-semibold text-gold-light transition-colors group-hover:bg-gold group-hover:text-navy-dark">
                    {c.cta} →
                  </span>
                )}
              </>
            );
            const cls =
              "group rounded-2xl border border-white/10 bg-white/5 p-7 text-center backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-gold/40 hover:bg-white/10";
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {c.href ? (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block h-full ${cls}`}
                  >
                    {inner}
                  </a>
                ) : (
                  <div className={`h-full ${cls}`}>{inner}</div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Extra info strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-12 flex flex-col items-center justify-center gap-6 rounded-2xl border border-gold/20 bg-gold/5 px-6 py-6 text-center sm:flex-row sm:gap-10"
        >
          <span className="inline-flex items-center gap-2 text-sm text-white/80">
            <MapPin className="h-4 w-4 text-gold" aria-hidden="true" />
            {SITE.location}
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-white/80">
            <Phone className="h-4 w-4 text-gold" aria-hidden="true" />
            {SITE.phoneDisplay}
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-white/80">
            <Clock className="h-4 w-4 text-gold" aria-hidden="true" />
            Atendimento pelo WhatsApp todos os dias
          </span>
        </motion.div>
      </div>
    </section>
  );
}
