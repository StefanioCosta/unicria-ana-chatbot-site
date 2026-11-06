import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export type Role = "owner" | "admin" | "atendente" | "viewer";

export const ROLE_HIERARCHY: Record<Role, number> = {
  viewer: 1,
  atendente: 2,
  admin: 3,
  owner: 4,
};

export function hasRole(userRole: Role, minRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
}

const SECRET = process.env.AUTH_SECRET;
if (!SECRET && process.env.NODE_ENV === "production") {
  throw new Error("AUTH_SECRET é obrigatório em produção. Defina uma chave forte com 32+ caracteres.");
}
const SESSION_SECRET = SECRET || crypto.randomBytes(32).toString("hex");
export const SESSION_COOKIE = "ana_session";

export interface SessionData {
  tenantId: string;
  userId: string;
  email: string;
  role: Role;
  exp: number; // timestamp ms
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function hashPassword(password: string, salt: string): string {
  return `scrypt$${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const candidate = storedHash.startsWith("scrypt$")
    ? hashPassword(password, salt).slice("scrypt$".length)
    : crypto.createHash("sha256").update(salt + password).digest("hex");
  const expected = storedHash.startsWith("scrypt$")
    ? storedHash.slice("scrypt$".length)
    : storedHash;
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}

export function createSessionToken(data: Omit<SessionData, "exp">): string {
  const payload: SessionData = {
    ...data,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
  };
  const raw = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${raw}.${sign(raw)}`;
}

export function verifySessionToken(token: string): SessionData | null {
  const [raw, sig] = token.split(".");
  if (!raw || !sig) return null;
  const expected = sign(raw);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(raw, "base64url").toString()) as SessionData;
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/** Lê a sessão a partir dos cookies da requisição (server-side). */
export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Guarda o cookie de sessão seguro (só funciona em Route Handlers / Server Actions). */
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Middleware helper para API routes:
 * 1. Devolve a sessão autenticada
 * 2. Verifica existência e estado do Tenant
 * 3. Valida permissões RBAC opcionais (ex: requireSession("admin"))
 */
export async function requireSession(
  minRoleOrAllowed?: Role | Role[]
): Promise<
  { ok: true; session: SessionData } | { ok: false; response: Response }
> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: Response.json(
        { error: "Não autenticado. Por favor, faça login." },
        { status: 401 }
      ),
    };
  }

  // Valida integridade do tenant e do utilizador em tempo real
  const [tenant, user] = await Promise.all([
    db.tenant.findUnique({ where: { id: session.tenantId } }),
    db.user.findUnique({ where: { id: session.userId } }),
  ]);

  if (!tenant) {
    return {
      ok: false,
      response: Response.json({ error: "Tenant inválido ou inativo." }, { status: 401 }),
    };
  }

  if (tenant.plan === "suspenso") {
    return {
      ok: false,
      response: Response.json(
        { error: "Conta suspensa. Contacte o suporte." },
        { status: 403 }
      ),
    };
  }

  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: "Utilizador não encontrado." }, { status: 401 }),
    };
  }

  const currentRole = (user.role as Role) || session.role || "viewer";

  // Verificação RBAC
  if (minRoleOrAllowed) {
    let allowed = false;
    if (Array.isArray(minRoleOrAllowed)) {
      allowed = minRoleOrAllowed.includes(currentRole);
    } else {
      allowed = hasRole(currentRole, minRoleOrAllowed);
    }

    if (!allowed) {
      return {
        ok: false,
        response: Response.json(
          {
            error: "Acesso negado: permissão insuficiente para realizar esta acção.",
            role: currentRole,
          },
          { status: 403 }
        ),
      };
    }
  }

  return {
    ok: true,
    session: {
      ...session,
      role: currentRole,
    },
  };
}
