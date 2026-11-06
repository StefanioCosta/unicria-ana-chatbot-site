/**
 * Seed Idempotente de Produção — Unicria Ana
 *
 * REGRAS DE PRODUÇÃO:
 * - NUNCA apaga dados existentes (sem deleteMany)
 * - Cria o Tenant inicial e utilizador Owner se não existirem
 * - Utiliza hash scrypt criptograficamente seguro
 * - Cadastra produtos base apenas se o catálogo estiver vazio
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { ANA_DEFAULT_PROMPT, ANA_DEFAULT_KNOWLEDGE } from "../src/lib/ana-prompt";

const db = new PrismaClient();

function hashPassword(password: string, salt: string): string {
  return `scrypt$${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

async function main() {
  console.log("🌱 [Seed Prod] A iniciar verificação de inicialização em produção...");

  // 1. Garante Tenant Unicria
  let tenant = await db.tenant.findUnique({
    where: { slug: "unicria" },
  });

  if (!tenant) {
    console.log("🏢 [Seed Prod] A criar Tenant Unicria inicial...");
    tenant = await db.tenant.create({
      data: {
        name: "Unicria",
        slug: "unicria",
        plan: "ativo",
        planPaidUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 ano
        botEnabled: true,
        botNumber: process.env.WHATSAPP_PHONE_ID || "+244950418496",
        anaPrompt: ANA_DEFAULT_PROMPT,
        knowledge: ANA_DEFAULT_KNOWLEDGE,
        openHour: 7,
        closeHour: 19,
        whatsappProvider: "cloud_api",
        whatsappVerifyTok: process.env.WHATSAPP_VERIFY_TOKEN || "unicria-verify-2026",
      },
    });
    console.log(`✅ [Seed Prod] Tenant criado com id: ${tenant.id}`);
  } else {
    console.log(`ℹ️ [Seed Prod] Tenant existente detectado (${tenant.name}). Ignorando recriação.`);
  }

  // 2. Garante Utilizador Owner inicial
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@unicria.ao";
  const existingUser = await db.user.findUnique({
    where: { email: adminEmail.toLowerCase().trim() },
  });

  if (!existingUser) {
    console.log(`👤 [Seed Prod] A criar utilizador Owner inicial (${adminEmail})...`);
    const initialPass = process.env.INITIAL_ADMIN_PASSWORD || "UnicriaProd@2026!Sec";
    const salt = crypto.randomBytes(16).toString("hex");

    await db.user.create({
      data: {
        tenantId: tenant.id,
        email: adminEmail.toLowerCase().trim(),
        name: "Administrador Unicria",
        role: "owner",
        salt,
        passwordHash: hashPassword(initialPass, salt),
      },
    });
    console.log(`✅ [Seed Prod] Utilizador Owner criado com sucesso!`);
    console.log(`⚠️ ATENÇÃO: Faça login imediatamente e altere a senha padrão.`);
  } else {
    console.log(`ℹ️ [Seed Prod] Utilizador (${adminEmail}) já registado.`);
  }

  // 3. Cadastra catálogo inicial se não existirem produtos
  const productCount = await db.product.count({ where: { tenantId: tenant.id } });
  if (productCount === 0) {
    console.log("📱 [Seed Prod] Catálogo vazio. A registar produtos base oficiais...");
    const products = [
      {
        name: "iPhone 13 Pro Max",
        description: "Smartphone Apple 128GB, ecrã 6.7\" Super Retina XDR",
        benefits: "Câmara profissional com modo Cinema, bateria para o dia todo, original selado",
        image: "/images/photo_2.jpg",
        priceKz: null,
      },
      {
        name: "iPhone 12 Pro",
        description: "Smartphone Apple 128GB, acabamento premium em aço cirúrgico",
        benefits: "Scanner LiDAR, fotos nocturnas nítidas, Ceramic Shield",
        image: "/images/photo_3.jpg",
        priceKz: null,
      },
      {
        name: "iPhone 13 Pro",
        description: "Smartphone Apple 128GB, ecrã ProMotion de 120Hz",
        benefits: "Desempenho super fluído, zoom óptico 3x, design compacto e potente",
        image: "/images/photo_4.jpg",
        priceKz: null,
      },
      {
        name: "iPhone 11 Pro",
        description: "Smartphone Apple 64GB/256GB, câmara tripla de 12MP",
        benefits: "Excelente relação custo-benefício, ecrã Super Retina OLED",
        image: "/images/photo_5.jpg",
        priceKz: null,
      },
      {
        name: "iPhone 11",
        description: "Smartphone Apple 64GB/128GB, ecrã Liquid Retina de 6.1\"",
        benefits: "Câmara dupla com ultra-angular, bateria duradoura, cores vibrantes",
        image: "/images/photo_6.jpg",
        priceKz: null,
      },
    ];

    for (const p of products) {
      await db.product.create({
        data: {
          tenantId: tenant.id,
          name: p.name,
          description: p.description,
          benefits: p.benefits,
          image: p.image,
          priceKz: p.priceKz,
          active: true,
        },
      });
    }
    console.log(`✅ [Seed Prod] ${products.length} produtos cadastrados com sucesso.`);
  }

  console.log("🎉 [Seed Prod] Concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ [Seed Prod] Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

