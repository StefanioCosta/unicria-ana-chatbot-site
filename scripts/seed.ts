/**
 * Seed do SaaS Ana — Unicria
 * Executar: bunx tsx scripts/seed.ts (ou bun run scripts/seed.ts)
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { ANA_DEFAULT_PROMPT, ANA_DEFAULT_KNOWLEDGE } from "../src/lib/ana-prompt";

const db = new PrismaClient();

function hashPassword(password: string, salt: string): string {
  return crypto.createHash("sha256").update(salt + password).digest("hex");
}

async function main() {
  console.log("A limpar dados antigos...");
  await db.message.deleteMany();
  await db.sale.deleteMany();
  await db.conversation.deleteMany();
  await db.product.deleteMany();
  await db.user.deleteMany();
  await db.tenant.deleteMany();

  console.log("A criar tenant Unicria...");
  const tenant = await db.tenant.create({
    data: {
      name: "Unicria",
      slug: "unicria",
      plan: "ativo",
      planPaidUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      botEnabled: true,
      botNumber: "+244950418496",
      anaPrompt: ANA_DEFAULT_PROMPT,
      knowledge: ANA_DEFAULT_KNOWLEDGE,
      openHour: 7,
      closeHour: 19,
      whatsappProvider: "cloud_api",
      whatsappVerifyTok: "unicria-verify-2026",
    },
  });

  const salt = crypto.randomBytes(8).toString("hex");
  await db.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@unicria.ao",
      name: "Eng. José Lopes",
      role: "owner",
      salt,
      passwordHash: hashPassword("unicria2026", salt),
    },
  });

  console.log("A criar produtos...");
  const products = [
    {
      name: "iPhone 13 Pro Max",
      description: "Smartphone Apple 128GB, ecrã 6.7\" Super Retina XDR",
      benefits: "Câmara profissional, bateria para o dia todo, original selado",
      image: "/images/photo_2.jpg",
    },
    {
      name: "iPhone 12 Pro",
      description: "Smartphone Apple 128GB, caixa original com cabo",
      benefits: "Câmara tripla, resistente à água, original Apple",
      image: "/images/photo_3.jpg",
    },
    {
      name: "iPhone 13 Pro",
      description: "Smartphone Apple 128GB branco",
      benefits: "Chip A15 Bionic, modo cinema, entrega rápida",
      image: "/images/photo_5.jpg",
    },
    {
      name: "iPhone 11 Pro",
      description: "Smartphone Apple 64GB cinza espacial",
      benefits: "Ecrã OLED, câmara tripla, bateria duradoura",
      image: "/images/photo_4.jpg",
    },
    {
      name: "iPhone 11",
      description: "Smartphone Apple 64GB branco",
      benefits: "Ideal para o dia a dia, câmara dupla, original",
      image: "/images/photo_6.jpg",
    },
    {
      name: "iPhone 11 Roxo",
      description: "Smartphone Apple 64GB roxo, com caixa e cabo",
      benefits: "Design exclusivo, ótima câmara, garantia",
      image: "/images/photo_7.jpg",
    },
  ];
  for (const p of products) {
    await db.product.create({ data: { ...p, tenantId: tenant.id } });
  }

  console.log("A criar conversas demo...");
  // Conversa 1 — venda fechada (agendada)
  const c1 = await db.conversation.create({
    data: {
      tenantId: tenant.id,
      customerName: "Maria Domingos",
      customerPhone: "+244923456789",
      status: "agendada",
      source: "simulador",
      createdAt: hoursAgo(3),
      lastMessageAt: hoursAgo(2.5),
    },
  });
  const msgs1: [string, string, number][] = [
    ["cliente", "Boa tarde! Quanto custa o iPhone 13 Pro Max?", 3.0],
    [
      "ana",
      "Olá, tudo bem? O iPhone 13 Pro Max está sob consulta nesta semana, já com entrega ao domicílio. Pagas só quando receberes. Queres que eu já reserve o teu? Hoje só temos poucas unidades 😊",
      2.98,
    ],
    ["cliente", "Funciona mesmo? é original?", 2.9],
    [
      "ana",
      "Funciona sim, pode confiar. É um dos que mais sai aqui na Kikolo e os clientes têm gostado muito. É original, com garantia 👍",
      2.88,
    ],
    ["cliente", "Ok quero comprar. Sou a Maria Domingos, 923456789, moro no Kilamba, Bloco C4, Apartamento 23, perto da escola", 2.7],
    [
      "ana",
      "Agendamento feito, Maria! Muito obrigada pela confiança na Unicria. Vais receber uma chamada da equipa de entrega para confirmar a morada. Qualquer coisa me chama aqui até às 19h ❤️",
      2.6,
    ],
  ];
  for (const [role, content, h] of msgs1) {
    await db.message.create({
      data: { conversationId: c1.id, role, content, createdAt: hoursAgo(h) },
    });
  }
  await db.sale.create({
    data: {
      tenantId: tenant.id,
      conversationId: c1.id,
      customerName: "Maria Domingos",
      customerPhone: "+244923456789",
      customerAddr: "Kilamba, Bloco C4, Apartamento 23, perto da escola — Luanda",
      productName: "iPhone 13 Pro Max",
      valueKz: 850000,
      status: "fechada",
      kikoloStatus: "simulado",
      kikoloProtocol: "KKL-DEMO01",
      createdAt: hoursAgo(2.6),
    },
  });

  // Conversa 2 — perdida (despedida)
  const c2 = await db.conversation.create({
    data: {
      tenantId: tenant.id,
      customerName: "João Kiala",
      customerPhone: "+244921112222",
      status: "perdida",
      source: "simulador",
      createdAt: hoursAgo(8),
      lastMessageAt: hoursAgo(7.5),
    },
  });
  const msgs2: [string, string, number][] = [
    ["cliente", "Preço do iPhone 11?", 8],
    ["ana", "Olá, tudo bem? O iPhone 11 está sob consulta, já com entrega ao domicílio. Pagas só quando receberes. Queres que eu já reserve o teu? 😊", 7.98],
    ["cliente", "Ah tá. Vou pensar mais, obrigado", 7.6],
    ["ana", "Claro, sem pressa! Quando quiseres é só dizer 'quero comprar' que eu já agendo para ti na hora. Ótimo dia! 😊", 7.5],
  ];
  for (const [role, content, h] of msgs2) {
    await db.message.create({
      data: { conversationId: c2.id, role, content, createdAt: hoursAgo(h) },
    });
  }
  await db.sale.create({
    data: {
      tenantId: tenant.id,
      conversationId: c2.id,
      customerName: "João Kiala",
      customerPhone: "+244921112222",
      productName: "iPhone 11",
      valueKz: 420000,
      status: "perdida",
      lossReason: "Cliente disse que vai pensar / preço",
      createdAt: hoursAgo(7.5),
    },
  });

  // Conversa 3 — aberta em curso
  const c3 = await db.conversation.create({
    data: {
      tenantId: tenant.id,
      customerName: "Ana Paula",
      customerPhone: "+244924445555",
      status: "aberta",
      source: "simulador",
      createdAt: hoursAgo(0.5),
      lastMessageAt: minutesAgo(10),
    },
  });
  const msgs3: [string, string, number][] = [
    ["cliente", "Olá, entregam no Cazenga?", 0.5],
    [
      "ana",
      "Olá, bem-vinda à Unicria! Aqui é a Ana 😊 Entregamos sim, no Cazenga chega em 24h até à tua porta. O que procuras hoje?",
      0.48,
    ],
    ["cliente", "Quero saber do iPhone 13 Pro", 0.2],
    [
      "ana",
      "Ótima escolha querida! O iPhone 13 Pro está sob consulta esta semana, original e com garantia. Pagas só quando o entregador chegar à tua porta. Queres que eu deixe um reservado em teu nome? Hoje temos poucas unidades 🛒",
      10 / 60,
    ],
  ];
  for (const [role, content, h] of msgs3) {
    await db.message.create({
      data: {
        conversationId: c3.id,
        role,
        content,
        createdAt: new Date(Date.now() - h * 3600000),
      },
    });
  }

  console.log("Seed concluído!");
  console.log("  Login: admin@unicria.ao | senha: unicria2026");
  console.log("  Tenant:", tenant.id);
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600000);
}
function minutesAgo(m: number): Date {
  return new Date(Date.now() - m * 60000);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
