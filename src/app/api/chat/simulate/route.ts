import { requireSession } from "@/lib/auth";
import { handleIncomingMessage } from "@/lib/ana";

/**
 * Simulador: permite testar a Ana sem WhatsApp real.
 * Simula a mensagem de um cliente e devolve a resposta da Ana.
 */
export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { phone, name, text } = (await req.json()) as {
    phone: string;
    name?: string;
    text: string;
  };
  if (!phone?.trim() || !text?.trim()) {
    return Response.json(
      { error: "Telefone e mensagem obrigatórios." },
      { status: 400 }
    );
  }

  try {
    const result = await handleIncomingMessage({
      tenantId: auth.session.tenantId,
      customerPhone: phone.trim(),
      customerName: name?.trim() || null,
      text: text.trim(),
      source: "simulador",
    });
    return Response.json(result);
  } catch (err) {
    console.error("Erro no motor da Ana:", err);
    return Response.json(
      { error: "A Ana não conseguiu responder agora. Tente novamente." },
      { status: 500 }
    );
  }
}
