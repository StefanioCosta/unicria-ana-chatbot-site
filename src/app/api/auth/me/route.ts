import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ authenticated: false }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { tenant: { select: { name: true, plan: true, botEnabled: true } } },
  });
  if (!user) return Response.json({ authenticated: false }, { status: 401 });

  return Response.json({
    authenticated: true,
    user: { name: user.name, email: user.email, role: user.role },
    tenant: user.tenant,
  });
}
