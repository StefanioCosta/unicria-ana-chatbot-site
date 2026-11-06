import { db } from "@/lib/db";
import { handleIncomingMessage } from "@/lib/ana";
import crypto from "crypto";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Webhook do WhatsApp Cloud API (Meta).
 *
 * Em produção:
 * - Exige assinatura HMAC SHA-256 no header x-hub-signature-256
 * - Valida tenant estritamente pelo phone_number_id recebido
 * - Rejeita payloads malformados ou não autenticados
 */

// Verificação do Webhook (GET do Meta com hub.challenge)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    const envToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (envToken && token === envToken) {
      return new Response(challenge || "", { status: 200 });
    }

    const tenant = await db.tenant.findFirst({
      where: { whatsappVerifyTok: token },
    });
    if (tenant) {
      return new Response(challenge || "", { status: 200 });
    }
  }

  return new Response("Forbidden", { status: 403 });
}

interface WaWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
          button?: { text?: string };
          interactive?: {
            button_reply?: { title?: string; id?: string };
            list_reply?: { title?: string; id?: string };
          };
        }>;
      };
    }>;
  }>;
}

// Recepção de eventos e mensagens (POST)
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const signature = req.headers.get("x-hub-signature-256");

    // Validação estrita de assinatura em produção
    if (IS_PROD || appSecret) {
      if (!appSecret) {
        console.error("[WhatsApp Webhook] WHATSAPP_APP_SECRET não está configurado em produção.");
        return Response.json({ error: "Configuração do servidor incompleta" }, { status: 503 });
      }

      if (!signature || !signature.startsWith("sha256=")) {
        console.warn("[WhatsApp Webhook] Assinatura ausente ou com formato inválido.");
        return Response.json({ error: "Assinatura ausente ou inválida" }, { status: 401 });
      }

      const expected = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");
      const received = signature.slice("sha256=".length);

      if (
        received.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
      ) {
        console.warn("[WhatsApp Webhook] Falha de validação criptográfica da assinatura HMAC.");
        return Response.json({ error: "Assinatura inválida" }, { status: 401 });
      }
    }

    let payload: WaWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as WaWebhookPayload;
    } catch {
      console.warn("[WhatsApp Webhook] Payload não é um JSON válido.");
      return Response.json({ error: "Payload malformado" }, { status: 400 });
    }

    const value = payload.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.length) {
      // Notificações de leitura/entrega (statuses) → responder 200 OK
      return Response.json({ ok: true });
    }

    const phoneNumberId = value.metadata?.phone_number_id;

    // Resolução segura de tenant pelo phone_number_id
    let tenant: Awaited<ReturnType<typeof db.tenant.findFirst>> = null;
    if (phoneNumberId) {
      tenant = await db.tenant.findFirst({
        where: { whatsappPhoneId: phoneNumberId },
      });
    }

    // Em produção: nunca adivinhar tenant se o phone_number_id for desconhecido
    if (!tenant) {
      if (IS_PROD) {
        console.warn(
          `[WhatsApp Webhook] [PROD] Nenhuma loja (tenant) registada com phone_number_id: ${phoneNumberId}`
        );
        return Response.json({ ok: true });
      }

      // Em dev, fallback para o primeiro tenant com bot activo
      tenant = await db.tenant.findFirst({
        where: { botEnabled: true, botNumber: { not: null } },
      });
    }

    if (!tenant) {
      return Response.json({ ok: true });
    }

    const contactName = value.contacts?.[0]?.profile?.name || null;

    for (const msg of value.messages) {
      const text =
        msg.text?.body ||
        msg.button?.text ||
        msg.interactive?.button_reply?.title ||
        msg.interactive?.list_reply?.title;

      if (!text || !msg.from) continue;

      await handleIncomingMessage({
        tenantId: tenant.id,
        customerPhone: msg.from,
        customerName: contactName,
        text,
        source: "whatsapp",
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[WhatsApp Webhook Fatal Error]:", err);
    // Meta exige retorno 200 para evitar reenvios em loop
    return Response.json({ ok: true });
  }
}
