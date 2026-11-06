import { db } from "@/lib/db";
import { ANA_OUTPUT_INSTRUCTION } from "./ana-prompt";

const IS_PROD = process.env.NODE_ENV === "production";
const ALLOW_FALLBACK = process.env.ALLOW_SIMULATED_FALLBACK === "true";

async function callOpenAI(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada no ambiente.");
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.6,
      messages: messages.map((message) => ({
        role:
          message.role === "user" || message.role === "assistant" || message.role === "system"
            ? message.role
            : "user",
        content: message.content,
      })),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || "";
}

/** Hora actual de Luanda (Africa/Luanda, UTC+1) */
export function luandaNow(): { hour: number; minutes: number; label: string } {
  const fmt = new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Africa/Luanda",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
  const parts = fmt.format(new Date());
  const timeMatch = parts.match(/(\d{2}):(\d{2})/);
  const hour = timeMatch ? parseInt(timeMatch[1], 10) : 12;
  const minutes = timeMatch ? parseInt(timeMatch[2], 10) : 0;
  return { hour, minutes, label: parts };
}

export interface AnaIntent {
  resposta: string;
  intencao:
    | "saudacao"
    | "informacao"
    | "objecao"
    | "agendar"
    | "fora_horario"
    | "humano"
    | "despedida";
  dados: {
    nome?: string | null;
    telefone?: string | null;
    morada?: string | null;
    produto?: string | null;
    valor?: number | null;
  };
}

/** Monta o system prompt completo da Ana com o contexto actual do tenant */
export function buildAnaSystemPrompt(
  tenant: {
    name: string;
    anaPrompt: string;
    knowledge: string;
    openHour: number;
    closeHour: number;
  },
  products: { name: string; priceKz: number | null; description: string | null; benefits: string | null }[],
  customerName?: string | null
): string {
  const { hour, minutes, label } = luandaNow();
  const withinHours = hour >= tenant.openHour && hour < tenant.closeHour;

  const catalog = products.length
    ? products
        .map((p) => {
          const preco = p.priceKz != null ? `${p.priceKz} Kz` : "sob consulta";
          const desc = p.description ? ` — ${p.description}` : "";
          const ben = p.benefits ? ` | Benefícios: ${p.benefits}` : "";
          return `- ${p.name} (${preco})${desc}${ben}`;
        })
        .join("\n")
    : "(catálogo vazio — se perguntarem por produtos, diz que vais confirmar o stock e pede uns minutos)";

  return `${tenant.anaPrompt}

${tenant.knowledge}

# CONTEXTO ACTUAL
- Loja: ${tenant.name}
- Data/hora de Luanda agora: ${label} (${hour.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")})
- Horário de atendimento: das ${tenant.openHour}h às ${tenant.closeHour}h
- ${withinHours ? "ESTAMOS DENTRO do horário de atendimento." : "ESTAMOS FORA do horário de atendimento — usa o texto de encerramento (resposta 20) e NÃO agendes."}
${customerName ? `- O cliente chama-se ${customerName} (já nos identificou antes).` : ""}

# CATÁLOGO ACTUAL (fonte única de verdade — usa estes preços)
${catalog}
${ANA_OUTPUT_INSTRUCTION}`;
}

/** Chama o LLM OpenAI real e devolve a intenção estruturada da Ana */
export async function anaThink(messages: { role: string; content: string }[]): Promise<{
  replyText: string;
  intent: AnaIntent | null;
}> {
  let raw = "";

  try {
    raw = await callOpenAI(messages);
  } catch (openAiError) {
    console.error("[Ana Engine] Erro na chamada à OpenAI:", openAiError);

    // Em produção, a regra é estrita: falha real não deve mascarar com simulação falsa
    if (IS_PROD || !ALLOW_FALLBACK) {
      throw openAiError;
    }

    // Apenas em desenvolvimento explícito (se ALLOW_SIMULATED_FALLBACK=true)
    console.warn("[Ana Engine] AVISO: A usar fallback local de desenvolvimento.");
    raw = JSON.stringify({
      resposta:
        "Olá! Sou a Ana da Unicria 😊 Posso ajudar com informações de iPhones, entregas e agendamento.",
      intencao: "informacao",
      dados: {
        nome: null,
        telefone: null,
        morada: null,
        produto: null,
        valor: null,
      },
    });
  }

  if (!raw) {
    throw new Error("Resposta vazia da OpenAI.");
  }

  const intent = tryParseIntent(raw);
  if (intent?.resposta) {
    return { replyText: intent.resposta, intent };
  }

  return { replyText: raw, intent: null };
}

function tryParseIntent(raw: string): AnaIntent | null {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const candidates = [cleaned];

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) candidates.push(cleaned.slice(start, end + 1));

  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c) as AnaIntent;
      if (parsed && typeof parsed.resposta === "string") {
        return {
          resposta: parsed.resposta,
          intencao: parsed.intencao || "informacao",
          dados: parsed.dados || {},
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

export interface IncomingResult {
  conversationId: string;
  anaReply: string | null;
  intent: AnaIntent | null;
  saleCreated: {
    id: string;
    customerName: string;
    productName: string;
    valueKz: number | null;
    kikoloStatus: string;
  } | null;
  botEnabled: boolean;
  withinHours: boolean;
  error?: string | null;
}

/**
 * Núcleo do chatbot: processa mensagens de clientes, gera resposta real com OpenAI,
 * persiste o histórico e dispara agendamentos sem simulações falsas em produção.
 */
export async function handleIncomingMessage(opts: {
  tenantId: string;
  customerPhone: string;
  customerName?: string | null;
  text: string;
  source: "whatsapp" | "simulador";
}): Promise<IncomingResult> {
  const { tenantId, customerPhone, text, source } = opts;

  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const { hour } = luandaNow();
  const withinHours = hour >= tenant.openHour && hour < tenant.closeHour;

  // 1. Busca ou cria conversa vinculada estritamente ao tenant
  let conversation = await db.conversation.findUnique({
    where: {
      tenantId_customerPhone_source: {
        tenantId,
        customerPhone,
        source,
      },
    },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        tenantId,
        customerPhone,
        customerName: opts.customerName || null,
        source,
        status: "aberta",
      },
    });
  }

  if (opts.customerName && !conversation.customerName) {
    conversation = await db.conversation.update({
      where: { id: conversation.id },
      data: { customerName: opts.customerName },
    });
  }

  // 2. Regista a mensagem do cliente
  await db.message.create({
    data: { conversationId: conversation.id, role: "cliente", content: text },
  });

  const base: IncomingResult = {
    conversationId: conversation.id,
    anaReply: null,
    intent: null,
    saleCreated: null,
    botEnabled: tenant.botEnabled,
    withinHours,
  };

  // 3. Bot desligado pelo lojista → encaminha para atendente humano
  if (!tenant.botEnabled) {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { status: "humana", lastMessageAt: new Date() },
    });
    return base;
  }

  // 4. Monta contexto e chama o modelo de IA
  const history = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 14,
  });
  history.reverse();

  const products = await db.product.findMany({
    where: { tenantId, active: true },
    orderBy: { createdAt: "asc" },
  });

  const systemPrompt = buildAnaSystemPrompt(tenant, products, conversation.customerName);

  const llmMessages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role === "cliente" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  let replyText = "";
  let intent: AnaIntent | null = null;

  try {
    const aiResult = await anaThink(llmMessages);
    replyText = aiResult.replyText;
    intent = aiResult.intent;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido na IA";
    console.error(`[Ana Error] Falha de IA no tenant ${tenantId}:`, errorMsg);

    // Em produção: transfere imediatamente para atendente humano
    await db.conversation.update({
      where: { id: conversation.id },
      data: { status: "humana", lastMessageAt: new Date() },
    });

    const fallbackNotice =
      "Olá! Estamos a transferir a sua mensagem para a nossa equipa de atendimento humano. Um consultor entrará em contacto em instantes.";

    await db.message.create({
      data: { conversationId: conversation.id, role: "ana", content: fallbackNotice },
    });

    if (source === "whatsapp") {
      const { deliverIfConfigured } = await import("./ana-send");
      await deliverIfConfigured(tenantId, customerPhone, fallbackNotice).catch((e) =>
        console.error("[WhatsApp Send Error on AI Failure]:", e)
      );
    }

    return {
      ...base,
      anaReply: fallbackNotice,
      error: errorMsg,
    };
  }

  // 5. Guarda resposta da Ana no histórico
  await db.message.create({
    data: { conversationId: conversation.id, role: "ana", content: replyText },
  });

  let saleCreated: IncomingResult["saleCreated"] = null;

  // 6. Intenção de agendamento: requer horário activo e os 3 dados essenciais
  if (
    intent?.intencao === "agendar" &&
    withinHours &&
    intent.dados?.nome &&
    intent.dados?.telefone &&
    intent.dados?.morada
  ) {
    const productName =
      intent.dados.produto ||
      history
        .filter((m) => m.role === "cliente")
        .map((m) => m.content)
        .slice(-1)[0] ||
      "Produto Unicria";

    const product = products.find(
      (p) =>
        p.name.toLowerCase().includes(productName.toLowerCase().slice(0, 8)) ||
        productName.toLowerCase().includes(p.name.toLowerCase().slice(0, 8))
    );

    const sale = await db.sale.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        customerName: intent.dados.nome,
        customerPhone: intent.dados.telefone,
        customerAddr: intent.dados.morada,
        productName: product?.name || productName,
        valueKz: intent.dados.valor ?? product?.priceKz ?? 0,
        status: "fechada",
        kikoloStatus: "pendente",
      },
    });

    await db.conversation.update({
      where: { id: conversation.id },
      data: { status: "agendada", customerName: intent.dados.nome },
    });

    // 7. Dispara agendamento real no Kikolo (assíncrono)
    const { scheduleOnKikolo } = await import("./kikolo");
    void scheduleOnKikolo(sale.id).catch((e) =>
      console.error("[Kikolo Trigger Error]:", e)
    );

    saleCreated = {
      id: sale.id,
      customerName: sale.customerName,
      productName: sale.productName,
      valueKz: sale.valueKz,
      kikoloStatus: sale.kikoloStatus,
    };
  }

  // 8. Actualização de estados da conversa
  if (intent?.intencao === "humano") {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { status: "humana", lastMessageAt: new Date() },
    });
  } else if (intent?.intencao === "despedida" && !saleCreated) {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { status: "perdida", lastMessageAt: new Date() },
    });
  } else {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
  }

  // 9. Envio real via WhatsApp Meta API / UAZAPI
  if (source === "whatsapp" && replyText) {
    const { deliverIfConfigured } = await import("./ana-send");
    await deliverIfConfigured(tenantId, customerPhone, replyText).catch((e) =>
      console.error("[WhatsApp Delivery Failed]:", e)
    );
  }

  return { ...base, anaReply: replyText, intent, saleCreated };
}
