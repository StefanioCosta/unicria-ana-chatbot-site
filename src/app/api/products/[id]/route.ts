import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ProductUpdateSchema } from "@/lib/validators";
import { logAuditAction } from "@/lib/security/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const product = await db.product.findFirst({
    where: { id, tenantId: auth.session.tenantId },
  });

  if (!product) {
    return Response.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  return Response.json({ product });
}

export async function PATCH(req: Request, { params }: Params) {
  // Apenas admin ou owner podem actualizar produtos
  const auth = await requireSession("admin");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await db.product.findFirst({
    where: { id, tenantId: auth.session.tenantId },
  });

  if (!existing) {
    return Response.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  try {
    const rawBody = await req.json();
    const parsed = ProductUpdateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Dados de actualização inválidos.",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await db.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.kikoloUrl !== undefined ? { kikoloUrl: data.kikoloUrl || null } : {}),
        ...(data.priceKz !== undefined ? { priceKz: data.priceKz } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.benefits !== undefined ? { benefits: data.benefits || null } : {}),
        ...(data.usage !== undefined ? { usage: data.usage || null } : {}),
        ...(data.image !== undefined ? { image: data.image || null } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });

    await logAuditAction({
      tenantId: auth.session.tenantId,
      userId: auth.session.userId,
      action: "product.update",
      entity: "Product",
      entityId: id,
      before: existing,
      after: updated,
      req,
    });

    return Response.json({ ok: true, product: updated });
  } catch (err) {
    console.error("[Product Update Error]:", err);
    return Response.json({ error: "Erro ao actualizar produto." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  // Apenas admin ou owner podem remover produtos
  const auth = await requireSession("admin");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await db.product.findFirst({
    where: { id, tenantId: auth.session.tenantId },
  });

  if (!existing) {
    return Response.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  await db.product.delete({ where: { id } });

  await logAuditAction({
    tenantId: auth.session.tenantId,
    userId: auth.session.userId,
    action: "product.delete",
    entity: "Product",
    entityId: id,
    before: existing,
    req,
  });

  return Response.json({ ok: true });
}

