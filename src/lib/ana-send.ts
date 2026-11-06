/**
 * Envio de mensagens WhatsApp — Cloud API (Meta) ou UAZAPI.
 * Em produção, regista erros reais sem ocultar falhas de comunicação.
 */
export async function deliverIfConfigured(
  tenantId: string,
  phone: string,
  text: string
): Promise<boolean> {
  const { db } = await import("@/lib/db");
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    console.warn(`[WhatsApp Send] Tenant ${tenantId} não encontrado.`);
    return false;
  }

  const provider = (
    process.env.WHATSAPP_PROVIDER || tenant.whatsappProvider || "cloud_api"
  ).toLowerCase();
  const token = process.env.WHATSAPP_TOKEN || tenant.whatsappToken || "";
  const phoneId = process.env.WHATSAPP_PHONE_ID || tenant.whatsappPhoneId || "";
  const uazapiUrl = process.env.UAZAPI_URL || tenant.uazapiUrl || "";

  if (provider === "cloud_api") {
    if (!token || !phoneId) {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          `[WhatsApp Send] Credenciais Meta Cloud API ausentes (token ou phoneId) para tenant ${tenant.name}.`
        );
      }
      return false;
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone.replace(/[^0-9]/g, ""),
          type: "text",
          text: { body: text },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `[WhatsApp Meta API Error] Status ${res.status} para o número ${phone}: ${errorText}`
        );
        return false;
      }

      return true;
    } catch (err) {
      console.error("[WhatsApp Meta API Exception]:", err);
      return false;
    }
  }

  if (provider === "uazapi") {
    if (!token || !uazapiUrl) {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          `[WhatsApp Send] Credenciais UAZAPI ausentes para tenant ${tenant.name}.`
        );
      }
      return false;
    }

    try {
      const res = await fetch(`${uazapiUrl.replace(/\/$/, "")}/send/text`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero: phone.replace(/[^0-9]/g, ""),
          texto: text,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[WhatsApp UAZAPI Error] Status ${res.status}: ${errorText}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error("[WhatsApp UAZAPI Exception]:", err);
      return false;
    }
  }

  return false;
}
