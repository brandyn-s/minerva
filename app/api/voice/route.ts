import { createGateway } from "ai";

export const maxDuration = 60;
export async function POST() {
  try {
    const apiKey = process.env.MINERVA_PRIME_VOICE_API;
    if (!apiKey) throw new Error("Voice is not configured. Please retry after voice access is restored.");
    const gateway = createGateway({ apiKey });
    const token = await gateway.experimental_realtime.getToken({ model: "openai/gpt-realtime-2" });
    return Response.json({ ...token, tools: [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Voice could not connect. Please retry." }, { status: 503 });
  }
}
