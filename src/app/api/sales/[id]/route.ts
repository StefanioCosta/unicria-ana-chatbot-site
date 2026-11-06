import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SaleUpdateSchema } from "@/lib/validators";
import { logAuditAction } from "@/lib/security/audit";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  // Atendentes, admins e owners podem actualizar estado de venda
  const auth = await requireSession("atendente");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await db.sale.findFirst({
    where: { id, tenantId: auth.session.tenantId },
  });
  if (!existing) {
    return Response.json({ error: "Venda não encontrada." }, { status: 404 });
  }

  try {
    const rawBody = await req.json();
    const parsed = SaleUpdateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Dados de venda inválidos.",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
        { status: 400 }
      );
    }

    const { status, lossReason, valueKz } = parsed.data;

    const sale = await db.sale.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(lossReason !== undefined ? { lossReason } : {}),
        ...(valueKz !== undefined ? { valueKz } : {}),
      },
    });

    // Sincroniza o estado da conversa associada
    if (sale.conversationId && status) {
      await db.conversation.update({
        where: { id: sale.conversationId },
        data: {
          status: status === "fechada" || status === "agendada" ? "agendada" : "perdida",
        },
      });
    }

    await logAuditAction({
      tenantId: auth.session.tenantId,
      userId: auth.session.userId,
      action: "sale.update",
      entity: "Sale",
      entityId: id,
      before: existing,
      after: sale,
      req,
    });

    return Response.json({ ok: true, sale });
  } catch (err) {
    console.error("[Sale Update Error]:", err);
    return Response.json({ error: "Erro ao actualizar venda." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  // Apenas admin ou owner podem apagar vendas
  const auth = await requireSession("admin");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await db.sale.findFirst({
    where: { id, tenantId: auth.session.tenantId },
  });
  if (!existing) {
    return Response.json({ error: "Venda não encontrada." }, { status: 404 });
  }

  await db.sale.delete({ where: { id } });

  await logAuditAction({
    tenantId: auth.session.tenantId,
    userId: auth.session.userId,
    action: "sale.delete",
    entity: "Sale",
    entityId: id,
    before: existing,
    req,
  });

  return Response.json({ ok: true });
}
