import { kv } from "@/lib/companion/kv";
import { isMockLlm, llmConfig } from "@/lib/companion/llm";

// Which backends are configured, so the UI can show/hide voice and picture controls.
export async function GET() {
  return Response.json({
    llm: isMockLlm() ? "mock" : llmConfig.model,
    vision: llmConfig.vision,
    tts: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_DEFAULT_VOICE),
    stt: Boolean(process.env.STT_BASE_URL),
    images: true,
    persistentStorage: kv.persistent,
  });
}
