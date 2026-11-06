"use client";

import { motion } from "framer-motion";
import { Truck, BadgeCheck, Globe, MessageCircle } from "lucide-react";
import { WhatsAppIcon } from "./icons";
import { PRODUCTS, SITE, productMessage, whatsappLink } from "@/lib/site-data";

const BENEFITS = [
  {
    icon: Truck,
    title: "Entrega Rápida",
    text: "Receba o seu pedido com toda a rapidez. Comprometemo-nos com prazos curtos para que não fique à espera.",
  },
  {
    icon: BadgeCheck,
    title: "Qualidade Garantida",
    text: "Todos os produtos são verificados antes do envio. Qualidade é o nosso compromisso com cada cliente.",
  },
  {
    icon: Globe,
    title: "Envio para Todo o País",
    text: "Estamos em Luanda, mas entregamos em todo o território nacional angolano. Onde estiver, chegamos até si.",
  },
  {
    icon: MessageCircle,
    title: "Atendimento no WhatsApp",
    text: "Fale directamente connosco pelo WhatsApp. Tiramos dúvidas, confirmamos encomendas e acompanhamos a entrega.",
  },
];

export function Benefits() {
  return (
    <section
      aria-label="Vantagens de comprar na Unicria"
      className="relative bg-cream py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
            Porque escolher a Unicria
          </span>
          <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
            Comprar on-line nunca foi tão{" "}
            <span className="text-gold-gradient">simples</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-navy/70">
            Da escolha do produto à entrega na sua porta, cuidamos de tudo para
            que a sua experiência de compra seja segura, rápida e sem
            complicações.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <motion.article
              key={b.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group rounded-2xl border border-navy/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold transition-colors group-hover:bg-gold group-hover:text-navy-dark">
                <b.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-navy">
                {b.title}
              </h3>
              <p className="text-sm leading-relaxed text-navy/70">{b.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Products() {
  return (
    <section
      id="produtos"
      aria-label="Produtos disponíveis"
      className="scroll-mt-16 bg-navy-dark py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-gold">
            Catálogo
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Os nossos <span className="text-gold-gradient">produtos</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Uma selecção dos produtos disponíveis na nossa loja. Preços sob
            consulta — fale connosco no WhatsApp para conhecer condições,
            disponibilidade e encomendar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-navy-light shadow-lg transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-2xl hover:shadow-gold/10"
            >
              <div className="relative aspect-square overflow-hidden bg-white">
                { }
                <img
                  src={p.image}
                  alt={p.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 rounded-full bg-navy-dark/85 px-3 py-1 text-xs font-semibold text-gold-light backdrop-blur">
                  Sob consulta
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                <p className="mt-0.5 text-sm text-white/60">Cor: {p.color}</p>
                <a
                  href={whatsappLink(productMessage(p))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-white transition-all hover:bg-[#1fb857] hover:shadow-lg hover:shadow-[#25D366]/25"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Pedir no WhatsApp
                </a>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 text-center text-sm text-white/50"
        >
          Não encontrou o que procura? Fale connosco —{" "}
          <a
            href={whatsappLink(
              "Olá Unicria! Estou à procura de um produto específico."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gold underline underline-offset-4 hover:text-gold-light"
          >
            encomende pelo WhatsApp {SITE.phoneDisplay}
          </a>
        </motion.p>
      </div>
    </section>
  );
}
