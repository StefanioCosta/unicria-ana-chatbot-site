import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  Role,
} from "@/lib/auth";
import { LoginSchema } from "@/lib/validators";
import { logSessionEvent, extractClientInfo } from "@/lib/security/audit";

// Rate limiting simples em memória (mitigação de brute force)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  entry.count += 1;
  return true;
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}

export async function POST(req: Request) {
  const clientInfo = extractClientInfo(req);
  const rateLimitKey = `${clientInfo.ipAddress}`;

  if (!checkRateLimit(rateLimitKey)) {
    return Response.json(
      {
        error:
          "Muitas tentativas consecutivas de login. Por segurança, tente novamente em 15 minutos.",
      },
      { status: 429 }
    );
  }

  try {
    const rawBody = await req.json();
    const parsed = LoginSchema.safeParse(rawBody);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Dados de login inválidos.",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: { tenant: true },
    });

    if (!user) {
      // Regista falha sem expor se o email existe ou não
      await logSessionEvent({
        tenantId: "unknown",
        event: "login_fail",
        req,
        meta: { email: normalizedEmail, reason: "user_not_found" },
      });

      return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    if (!verifyPassword(password, user.salt, user.passwordHash)) {
      await logSessionEvent({
        tenantId: user.tenantId,
        userId: user.id,
        event: "login_fail",
        req,
        meta: { email: normalizedEmail, reason: "invalid_password" },
      });

      return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    // Migração transparente de SHA-256 para scrypt forte
    if (!user.passwordHash.startsWith("scrypt$")) {
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password, user.salt) },
      });
    }

    if (user.tenant.plan === "suspenso") {
      return Response.json(
        { error: "Acesso suspenso. Por favor, regularize a sua subscrição com o suporte." },
        { status: 403 }
      );
    }

    const role = (user.role as Role) || "viewer";

    const token = createSessionToken({
      tenantId: user.tenantId,
      userId: user.id,
      email: user.email,
      role,
    });

    await setSessionCookie(token);

    // Limpa contadores de rate limit
    clearRateLimit(rateLimitKey);

    // Regista login bem-sucedido no SessionLog
    await logSessionEvent({
      tenantId: user.tenantId,
      userId: user.id,
      event: "login_success",
      req,
      meta: { role },
    });

    return Response.json({
      ok: true,
      user: { name: user.name, email: user.email, role },
      tenant: { name: user.tenant.name, plan: user.tenant.plan },
    });
  } catch (err) {
    console.error("[Login Route Error]:", err);
    return Response.json({ error: "Erro interno no servidor ao processar o login." }, { status: 500 });
  }
}
