import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { MessageCreateSchema, ConversationPatchSchema } from "@/lib/validators";
import { logAuditAction } from "@/lib/security/audit";

type Params = { params: Promise<{ id: string }> };

/** Detalhe da conversa: mensagens + dados do cliente */
export async function GET(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const conversation = await db.conversation.findFirst({
    where: { id, tenantId: auth.session.tenantId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      sales: true,
    },
  });

  if (!conversation) {
    return Response.json({ error: "Conversa não encontrada." }, { status: 404 });
  }

  return Response.json({ conversation });
}

/** Atendente humano assume/responde na conversa */
export async function POST(req: Request, { params }: Params) {
  // Atendente, admin e owner podem responder directamente a clientes
  const auth = await requireSession("atendente");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const rawBody = await req.json();
  const parsed = MessageCreateSchema.safeParse(rawBody);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Mensagem inválida.",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 }
    );
  }

  const { text } = parsed.data;

  const conversation = await db.conversation.findFirst({
    where: { id, tenantId: auth.session.tenantId },
  });

  if (!conversation) {
    return Response.json({ error: "Conversa não encontrada." }, { status: 404 });
  }

  const message = await db.message.create({
    data: { conversationId: id, role: "humano", content: text.trim() },
  });

  await db.conversation.update({
    where: { id },
    data: { status: "humana", lastMessageAt: new Date() },
  });

  // Envio real via WhatsApp
  const { deliverIfConfigured } = await import("@/lib/ana-send");
  await deliverIfConfigured(
    auth.session.tenantId,
    conversation.customerPhone,
    text.trim()
  ).catch((e) => console.error("[Manual WhatsApp Delivery Error]:", e));

  return Response.json({ ok: true, message });
}

/** Altera estado da conversa (ex: marcar perdida, agendada) */
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireSession("atendente");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const rawBody = await req.json();
  const parsed = ConversationPatchSchema.safeParse(rawBody);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Dados de actualização inválidos.",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 }
    );
  }

  const { status, lossReason } = parsed.data;

  const conversation = await db.conversation.findFirst({
    where: { id, tenantId: auth.session.tenantId },
  });

  if (!conversation) {
    return Response.json({ error: "Conversa não encontrada." }, { status: 404 });
  }

  await db.conversation.update({ where: { id }, data: { status } });

  if (status === "perdida") {
    await db.sale.updateMany({
      where: { conversationId: id, status: { not: "perdida" } },
      data: {
        status: "perdida",
        lossReason: lossReason || "Marcada como perdida pelo atendente",
      },
    });
  }

  await logAuditAction({
    tenantId: auth.session.tenantId,
    userId: auth.session.userId,
    action: "conversation.status_change",
    entity: "Conversation",
    entityId: id,
    before: { status: conversation.status },
    after: { status, lossReason },
    req,
  });

  return Response.json({ ok: true });
}
