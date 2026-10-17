import { textToSpeech } from "@/lib/companion/media";

// POST { text, voiceId? } -> audio/mpeg
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { text?: string; voiceId?: string };
  const text = (body.text ?? "").trim();
  if (!text) return Response.json({ error: "text is required" }, { status: 400 });
  return textToSpeech(text, body.voiceId);
}
