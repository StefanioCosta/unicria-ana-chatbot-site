import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const { tenantId } = auth.session;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [convsToday, closed, lost, convsWeek, lastConvs] = await Promise.all([
    db.conversation.count({ where: { tenantId, createdAt: { gte: startOfToday } } }),
    db.sale.findMany({ where: { tenantId, status: "fechada" } }),
    db.sale.findMany({ where: { tenantId, status: "perdida" } }),
    db.sale.findMany({ where: { tenantId, createdAt: { gte: weekAgo } } }),
    db.conversation.findMany({
      where: { tenantId },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        status: true,
        lastMessageAt: true,
      },
    }),
  ]);

  const totalFechado = closed.reduce((s, v) => s + v.valueKz, 0);
  const totalPerdido = lost.reduce((s, v) => s + v.valueKz, 0);
  const totalConvs = closed.length + lost.length;
  const winRate = totalConvs ? Math.round((closed.length / totalConvs) * 100) : 0;

  // Vendas dos últimos 7 dias (para o gráfico)
  const dias: { dia: string; valor: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d.getTime() + 24 * 3600 * 1000);
    const valor = closed
      .filter((s) => s.createdAt >= d && s.createdAt < next)
      .reduce((sum, s) => sum + s.valueKz, 0);
    dias.push({
      dia: d.toLocaleDateString("pt-PT", { weekday: "short" }),
      valor,
    });
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { botEnabled: true, botNumber: true, plan: true },
  });

  return Response.json({
    conversasHoje: convsToday,
    vendasFechadas: closed.length,
    vendasPerdidas: lost.length,
    valorTotal: totalFechado,
    valorPerdido: totalPerdido,
    winRate,
    grafico: dias,
    ultimasConversas: lastConvs,
    bot: tenant,
  });
}
