import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://unicria.ao"),
  title: "Ana — Atendimento Unicria | Painel SaaS",
  description:
    "Painel de gestão do chatbot de vendas Ana: conversas WhatsApp com IA, agendamento automático na Kikolo Online, métricas de vendas e sistema multi-usuário.",
  keywords: [
    "Unicria",
    "Angola",
    "Luanda",
    "loja online",
    "iPhone Angola",
    "vendas online",
    "smartphones",
    "eletrónicos",
  ],
  authors: [{ name: "Unicria" }],
  icons: {
    icon: "/images/photo_1.jpg",
  },
  openGraph: {
    title: "Unicria — Vendas de Produtos On-line em Angola 🇦🇴",
    description:
      "Tudo o que você precisa, com qualidade e entrega rápida. Enviamos para Luanda e todo o país.",
    siteName: "Unicria",
    type: "website",
    locale: "pt_AO",
    images: [{ url: "/images/photo_1.jpg", width: 720, height: 720 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unicria — Vendas de Produtos On-line em Angola 🇦🇴",
    description:
      "Tudo o que você precisa, com qualidade e entrega rápida. Enviamos para Luanda e todo o país.",
    images: ["/images/photo_1.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#16233c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
