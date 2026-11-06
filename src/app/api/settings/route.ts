import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SettingsUpdateSchema } from "@/lib/validators";
import { logAuditAction } from "@/lib/security/audit";

const SECRET_FIELDS = new Set([
  "whatsappToken",
  "whatsappPhoneId",
  "whatsappVerifyTok",
  "kikoloPassword",
]);

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const tenant = await db.tenant.findUnique({
    where: { id: auth.session.tenantId },
    select: {
      name: true,
      slug: true,
      plan: true,
      botEnabled: true,
      botNumber: true,
      anaPrompt: true,
      knowledge: true,
      openHour: true,
      closeHour: true,
      whatsappProvider: true,
      whatsappPhoneId: true,
      whatsappToken: true,
      whatsappVerifyTok: true,
      uazapiUrl: true,
      kikoloUrl: true,
      kikoloEmail: true,
      kikoloPassword: true,
    },
  });

  if (!tenant) {
    return Response.json({ error: "Tenant não encontrado." }, { status: 404 });
  }

  // Mascara segredos sensíveis para a resposta da API
  return Response.json({
    tenant: {
      ...tenant,
      whatsappToken: tenant.whatsappToken ? "********" : null,
      kikoloPassword: tenant.kikoloPassword ? "********" : null,
    },
  });
}

export async function PATCH(req: Request) {
  // Apenas admin ou owner podem aceder à edição de configurações
  const auth = await requireSession("admin");
  if (!auth.ok) return auth.response;

  const rawBody = await req.json();
  const parsed = SettingsUpdateSchema.safeParse(rawBody);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Dados de configuração inválidos.",
        details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      },
      { status: 400 }
    );
  }

  const userRole = auth.session.role;
  const body = parsed.data;

  // Verificação RBAC restrita: apenas 'owner' pode mexer em segredos de integração
  if (userRole !== "owner") {
    const hasSecretAttempt = Object.keys(body).some(
      (k) => SECRET_FIELDS.has(k) && body[k as keyof typeof body] !== undefined
    );
    if (hasSecretAttempt) {
      return Response.json(
        {
          error:
            "Acesso negado: apenas o utilizador com perfil 'owner' pode alterar credenciais e chaves secretas de integração.",
        },
        { status: 403 }
      );
    }
  }

  // Snapshot anterior para auditoria
  const beforeTenant = await db.tenant.findUnique({
    where: { id: auth.session.tenantId },
  });

  const dataToUpdate: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;

    // Não substitui segredos se vierem vazios ou mascarados
    if ((key === "whatsappToken" || key === "kikoloPassword") && (!value || value === "********")) {
      continue;
    }

    dataToUpdate[key] = value === "" ? null : value;
  }

  const updatedTenant = await db.tenant.update({
    where: { id: auth.session.tenantId },
    data: dataToUpdate,
    select: {
      name: true,
      botEnabled: true,
      botNumber: true,
      anaPrompt: true,
      knowledge: true,
      openHour: true,
      closeHour: true,
      whatsappProvider: true,
      whatsappPhoneId: true,
      whatsappToken: true,
      whatsappVerifyTok: true,
      uazapiUrl: true,
      kikoloUrl: true,
      kikoloEmail: true,
      kikoloPassword: true,
    },
  });

  // Regista no log de auditoria
  await logAuditAction({
    tenantId: auth.session.tenantId,
    userId: auth.session.userId,
    action: "tenant.settings_update",
    entity: "Tenant",
    entityId: auth.session.tenantId,
    before: beforeTenant,
    after: updatedTenant,
    req,
  });

  return Response.json({
    ok: true,
    tenant: {
      ...updatedTenant,
      whatsappToken: updatedTenant.whatsappToken ? "********" : null,
      kikoloPassword: updatedTenant.kikoloPassword ? "********" : null,
    },
  });
}
