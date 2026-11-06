import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const { tenantId } = auth.session;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const sales = await db.sale.findMany({
    where: {
      tenantId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const totalFechado = sales
    .filter((s) => s.status === "fechada" || s.status === "agendada")
    .reduce((sum, s) => sum + s.valueKz, 0);

  return Response.json({ sales, totalFechado });
}
