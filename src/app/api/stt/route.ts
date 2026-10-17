import { speechToText } from "@/lib/companion/media";

const MAX_AUDIO = 15_000_000;

// POST multipart { audio } -> { text }
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) return Response.json({ error: "audio is required" }, { status: 400 });
  if (audio.size > MAX_AUDIO) return Response.json({ error: "audio too large" }, { status: 413 });
  const result = await speechToText(audio);
  return Response.json(result.text !== undefined ? { text: result.text } : { error: result.error }, { status: result.status });
}
