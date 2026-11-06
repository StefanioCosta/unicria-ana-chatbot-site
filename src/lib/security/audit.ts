import { db } from "@/lib/db";

const SENSITIVE_FIELDS = new Set([
  "password",
  "passwordHash",
  "salt",
  "whatsappToken",
  "kikoloPassword",
  "whatsappAppSecret",
  "token",
  "secret",
]);

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key)) {
      clean[key] = "[REDACTED]";
    } else if (val && typeof val === "object") {
      clean[key] = sanitize(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export function extractClientInfo(req?: Request): { ipAddress: string; userAgent: string } {
  if (!req) return { ipAddress: "127.0.0.1", userAgent: "system" };

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  return { ipAddress: ip, userAgent };
}

export async function logAuditAction(opts: {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  req?: Request;
}): Promise<void> {
  try {
    const { ipAddress, userAgent } = extractClientInfo(opts.req);
    await db.auditLog.create({
      data: {
        tenantId: opts.tenantId,
        userId: opts.userId || null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        before: opts.before ? JSON.stringify(sanitize(opts.before)) : null,
        after: opts.after ? JSON.stringify(sanitize(opts.after)) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[AuditLog Error] Falha ao registar auditoria:", err);
  }
}

export async function logSessionEvent(opts: {
  tenantId: string;
  userId?: string | null;
  event: "login_success" | "login_fail" | "logout" | "token_refresh" | "password_reset";
  req?: Request;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { ipAddress, userAgent } = extractClientInfo(opts.req);
    await db.sessionLog.create({
      data: {
        tenantId: opts.tenantId,
        userId: opts.userId || null,
        event: opts.event,
        ipAddress,
        userAgent,
        meta: opts.meta ? JSON.stringify(sanitize(opts.meta)) : null,
      },
    });
  } catch (err) {
    console.error("[SessionLog Error] Falha ao registar log de sessão:", err);
  }
}

