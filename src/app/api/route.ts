import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "Ana — Atendimento Unicria",
    status: "online",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/api/webhook/whatsapp (GET verify / POST receive)",
      "/api/chat/simulate (POST)",
      "/api/conversations (GET)",
      "/api/sales (GET)",
      "/api/products (GET/POST/PATCH/DELETE)",
      "/api/settings (GET/PATCH)",
      "/api/stats (GET)",
      "/api/auth/login (POST)",
      "/api/kikolo/test (POST)",
    ],
  });
}
