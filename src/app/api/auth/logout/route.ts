import { clearSessionCookie, getSession } from "@/lib/auth";
import { logSessionEvent } from "@/lib/security/audit";

export async function POST(req: Request) {
  const session = await getSession();
  if (session) {
    await logSessionEvent({
      tenantId: session.tenantId,
      userId: session.userId,
      event: "logout",
      req,
    });
  }

  await clearSessionCookie();
  return Response.json({ ok: true });
}
