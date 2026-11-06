import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ProductCreateSchema } from "@/lib/validators";
import { logAuditAction } from "@/lib/security/audit";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const products = await db.product.findMany({
    where: { tenantId: auth.session.tenantId },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ products });
}

export async function POST(req: Request) {
  // Apenas admin ou owner podem cadastrar produtos
  const auth = await requireSession("admin");
  if (!auth.ok) return auth.response;

  try {
    const rawBody = await req.json();
    const parsed = ProductCreateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Dados de produto inválidos.",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const product = await db.product.create({
      data: {
        tenantId: auth.session.tenantId,
        name: data.name,
        kikoloUrl: data.kikoloUrl || null,
        priceKz: data.priceKz ?? null,
        description: data.description || null,
        benefits: data.benefits || null,
        usage: data.usage || null,
        image: data.image || null,
        active: data.active ?? true,
      },
    });

    await logAuditAction({
      tenantId: auth.session.tenantId,
      userId: auth.session.userId,
      action: "product.create",
      entity: "Product",
      entityId: product.id,
      after: product,
      req,
    });

    return Response.json({ ok: true, product });
  } catch (err) {
    console.error("[Product Create Error]:", err);
    return Response.json({ error: "Erro ao criar produto." }, { status: 500 });
  }
}
