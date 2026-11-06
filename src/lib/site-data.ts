/**
 * Dados centrais do site Unicria
 * Extraídos da página oficial do Facebook:
 * https://www.facebook.com/p/Unicria-61552489509504/
 */

export const SITE = {
  name: "Unicria",
  tagline: "Vendas de Produtos On-line em Angola",
  description:
    "Tudo o que você precisa, com qualidade e entrega rápida. Enviamos para Luanda e todo o país.",
  bio: [
    "Unicria 🛒",
    "Vendas de Produtos On-line em Angola 🇦🇴",
    "Tudo o que você precisa, com qualidade e entrega rápida.",
    "Enviamos para Luanda e todo país.",
  ],
  phoneDisplay: "+244 950 418 496",
  whatsappNumber: "244950418496",
  facebookUrl: "https://www.facebook.com/p/Unicria-61552489509504/",
  followers: 147,
  location: "Luanda, Angola",
  logo: "/images/photo_1.jpg",
  cover: "/images/cover.jpg",
} as const;

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const DEFAULT_MESSAGE =
  "Olá Unicria! 👋 Vi o vosso site e gostaria de saber mais sobre os produtos.";

export interface Product {
  id: number;
  name: string;
  color: string;
  image: string;
  alt: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "iPhone 13 Pro Max",
    color: "Azul Sierra",
    image: "/images/photo_2.jpg",
    alt: "iPhone 13 Pro Max azul Sierra — Unicria Angola",
  },
  {
    id: 2,
    name: "iPhone 12 Pro",
    color: "Prateado",
    image: "/images/photo_3.jpg",
    alt: "iPhone 12 Pro prateado com caixa e cabo — Unicria Angola",
  },
  {
    id: 3,
    name: "iPhone 13 Pro",
    color: "Branco",
    image: "/images/photo_5.jpg",
    alt: "iPhone 13 Pro branco — Unicria Angola",
  },
  {
    id: 4,
    name: "iPhone 11 Pro",
    color: "Cinza Espacial",
    image: "/images/photo_4.jpg",
    alt: "iPhone 11 Pro cinza espacial — Unicria Angola",
  },
  {
    id: 5,
    name: "iPhone 11",
    color: "Branco",
    image: "/images/photo_6.jpg",
    alt: "iPhone 11 branco — Unicria Angola",
  },
  {
    id: 6,
    name: "iPhone 11",
    color: "Roxo",
    image: "/images/photo_7.jpg",
    alt: "iPhone 11 roxo com caixa — Unicria Angola",
  },
];

export function productMessage(p: Product): string {
  return `Olá Unicria! 👋 Tenho interesse no ${p.name} na cor ${p.color}. Está disponível?`;
}
