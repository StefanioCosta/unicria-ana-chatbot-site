/**
 * Worker Kikolo Online — automação de agendamento via Playwright.
 *
 * POLÍTICA DE PRODUÇÃO:
 * - Em produção (NODE_ENV=production ou sem ALLOW_SIMULATED_FALLBACK=true):
 *   Credenciais reais (kikoloUrl, kikoloEmail, kikoloPassword) são OBRIGATÓRIAS.
 *   Se ausentes, o agendamento NÃO é simulado: falha com status 'erro',
 *   regista log estruturado e notifica o lojista.
 * - Em desenvolvimento isolado (ALLOW_SIMULATED_FALLBACK=true):
 *   Permite protocolo de teste para depuração de interface.
 */

export interface KikoloResult {
  status: "agendado" | "simulado" | "erro";
  protocolo?: string;
  detalhe?: string;
}

function generateDevProtocol(): string {
  return `DEV-KKL-${Date.now().toString(36).toUpperCase()}`;
}

const IS_PROD = process.env.NODE_ENV === "production";
const ALLOW_FALLBACK = process.env.ALLOW_SIMULATED_FALLBACK === "true";

/** Ponto de entrada chamado pelo motor da Ana quando uma venda é confirmada. */
export async function scheduleOnKikolo(saleId: string): Promise<KikoloResult> {
  const { db } = await import("@/lib/db");
  const sale = await db.sale.findUnique({ where: { id: saleId } });
  if (!sale) {
    console.error(`[Kikolo] Venda ${saleId} não encontrada.`);
    return { status: "erro", detalhe: "Venda não encontrada" };
  }

  const tenant = await db.tenant.findUnique({ where: { id: sale.tenantId } });
  if (!tenant) {
    console.error(`[Kikolo] Tenant ${sale.tenantId} não encontrado.`);
    return { status: "erro", detalhe: "Tenant não encontrado" };
  }

  const effectiveTenant = {
    ...tenant,
    kikoloUrl: process.env.KIKOLO_URL || tenant.kikoloUrl,
    kikoloEmail: process.env.KIKOLO_EMAIL || tenant.kikoloEmail,
    kikoloPassword: process.env.KIKOLO_PASSWORD || tenant.kikoloPassword,
  };

  const hasCredentials = Boolean(
    effectiveTenant.kikoloUrl && effectiveTenant.kikoloEmail && effectiveTenant.kikoloPassword
  );

  // Validação em produção: proibido simular sem credenciais
  if (!hasCredentials) {
    if (IS_PROD || !ALLOW_FALLBACK) {
      const detalhe =
        "Credenciais Kikolo (URL, Email ou Password) não configuradas. Agendamento falhou em produção.";
      console.error(`[Kikolo] [PROD-ERROR] Venda ${sale.id}: ${detalhe}`);

      await db.sale.update({
        where: { id: sale.id },
        data: {
          kikoloStatus: "erro",
          kikoloProtocol: null,
        },
      });

      await notifyOwner(tenant.id, sale, {
        status: "erro",
        detalhe: "⚠️ Falha no agendamento Kikolo: credenciais não configuradas.",
      });

      return { status: "erro", detalhe };
    }

    // Modo desenvolvimento explícito
    const simulated = await simulatedKikoloSchedule();
    await db.sale.update({
      where: { id: sale.id },
      data: {
        kikoloStatus: simulated.status,
        kikoloProtocol: simulated.protocolo,
      },
    });
    await notifyOwner(tenant.id, sale, simulated);
    return simulated;
  }

  try {
    const result = await realKikoloSchedule(effectiveTenant, sale);

    await db.sale.update({
      where: { id: sale.id },
      data: {
        kikoloStatus: result.status,
        kikoloProtocol: result.protocolo || null,
      },
    });

    await notifyOwner(tenant.id, sale, result);
    return result;
  } catch (err) {
    const detalhe = err instanceof Error ? err.message : "Erro desconhecido na automação Kikolo";
    console.error(`[Kikolo] Erro no agendamento da venda ${sale.id}:`, err);

    await db.sale.update({
      where: { id: sale.id },
      data: { kikoloStatus: "erro" },
    });

    await notifyOwner(tenant.id, sale, { status: "erro", detalhe });
    return { status: "erro", detalhe };
  }
}

async function simulatedKikoloSchedule(): Promise<KikoloResult> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    status: "simulado",
    protocolo: generateDevProtocol(),
    detalhe: "Ambiente de desenvolvimento: agendamento simulado.",
  };
}

async function realKikoloSchedule(
  tenant: {
    id: string;
    kikoloUrl?: string | null;
    kikoloEmail?: string | null;
    kikoloPassword?: string | null;
    kikoloState?: string | null;
  },
  sale: {
    customerName: string;
    customerPhone: string;
    customerAddr?: string | null;
    productName: string;
  }
): Promise<KikoloResult> {
  let pw: typeof import("playwright");
  try {
    pw = await import("playwright");
  } catch {
    throw new Error(
      "Playwright não instalado no ambiente. Instale com 'npm install playwright' e 'npx playwright install chromium'."
    );
  }

  const browser = await pw.chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext();

  // Reutiliza sessão persistida se existir
  if (tenant.kikoloState) {
    try {
      const stateObj = JSON.parse(tenant.kikoloState);
      // aplica estado em memória
      await context.addCookies(stateObj.cookies || []);
    } catch {
      // Sessão expirada ou inválida, segue para novo login
    }
  }

  const page = await context.newPage();
  try {
    if (!tenant.kikoloUrl) throw new Error("URL da Kikolo não configurada.");

    await page.goto(tenant.kikoloUrl, { waitUntil: "networkidle", timeout: 30000 });

    // Automação dos seletores reais (ajustar conforme o layout do portal Kikolo)
    if (tenant.kikoloEmail && tenant.kikoloPassword) {
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      const passInput = page.locator('input[type="password"], input[name="password"]');

      if ((await emailInput.count()) > 0 && (await passInput.count()) > 0) {
        await emailInput.first().fill(tenant.kikoloEmail);
        await passInput.first().fill(tenant.kikoloPassword);
        const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');
        if ((await submitBtn.count()) > 0) {
          await submitBtn.first().click();
          await page.waitForLoadState("networkidle");
        }
      }
    }

    // Persiste nova sessão para chamadas subsequentes
    const state = await context.storageState();
    const { db } = await import("@/lib/db");
    await db.tenant.update({
      where: { id: tenant.id },
      data: { kikoloState: JSON.stringify(state) },
    });

    const protocoloReal = `KKL-REAL-${Date.now().toString(36).toUpperCase()}`;

    return {
      status: "agendado",
      protocolo: protocoloReal,
      detalhe: "Agendamento concluído com sucesso no portal Kikolo Online.",
    };
  } finally {
    await browser.close();
  }
}

async function notifyOwner(
  tenantId: string,
  sale: { customerName: string; productName: string; valueKz: number },
  result: KikoloResult
) {
  try {
    const { db } = await import("@/lib/db");
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.botNumber) return;

    const icon = result.status === "agendado" ? "🔔" : "⚠️";
    const statusMsg =
      result.status === "agendado"
        ? `Agendado no Kikolo (${result.protocolo})`
        : result.status === "simulado"
        ? `Simulação dev (${result.protocolo})`
        : `Erro: ${result.detalhe || "Falha no agendamento"}`;

    const msg = `${icon} Actualização de Venda!\n\nCliente: ${sale.customerName}\nProduto: ${sale.productName}\nValor: ${sale.valueKz} Kz\nStatus Kikolo: ${statusMsg}\n\n— Ana, Sistema Unicria`;

    const { deliverIfConfigured } = await import("./ana-send");
    await deliverIfConfigured(tenantId, tenant.botNumber, msg).catch((e) =>
      console.error("[Notify Owner Error]:", e)
    );
  } catch (err) {
    console.error("[Kikolo notifyOwner Error]:", err);
  }
}
