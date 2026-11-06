import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const { tenantId } = auth.session;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";

  const conversations = await db.conversation.findMany({
    where: {
      tenantId,
      OR: q
        ? [
            { customerName: { contains: q } },
            { customerPhone: { contains: q } },
          ]
        : undefined,
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      sales: { select: { id: true, valueKz: true, status: true } },
    },
  });

  return Response.json({ conversations });
}
