import "server-only";

// Voice out: ElevenLabs text-to-speech (as in the video's elevenlabs_tts extension).
export async function textToSpeech(text: string, voiceId?: string): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = voiceId || process.env.ELEVENLABS_DEFAULT_VOICE;
  if (!key || !voice) return Response.json({ error: "TTS not configured (ELEVENLABS_API_KEY / ELEVENLABS_DEFAULT_VOICE)" }, { status: 501 });

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text: text.slice(0, 2500), model_id: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2" }),
  });
  if (!res.ok || !res.body) return Response.json({ error: `TTS failed (${res.status})` }, { status: 502 });
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}

// Voice in: Whisper-compatible transcription (OpenAI API, faster-whisper-server, LocalAI, ...).
export async function speechToText(audio: Blob): Promise<{ text?: string; error?: string; status: number }> {
  const base = process.env.STT_BASE_URL?.replace(/\/$/, "");
  if (!base) return { error: "STT not configured (STT_BASE_URL)", status: 501 };
  const form = new FormData();
  form.append("file", audio, "audio.webm");
  form.append("model", process.env.STT_MODEL ?? "whisper-1");
  const res = await fetch(`${base}/audio/transcriptions`, {
    method: "POST",
    headers: process.env.STT_API_KEY ? { Authorization: `Bearer ${process.env.STT_API_KEY}` } : {},
    body: form,
  });
  if (!res.ok) return { error: `STT failed (${res.status})`, status: 502 };
  const json = (await res.json()) as { text?: string };
  return { text: json.text?.trim() ?? "", status: 200 };
}

// Pictures: Stable Diffusion via the AUTOMATIC1111 / Forge API (as in the video's sd_api_pictures extension).
export async function generateImage(prompt: string): Promise<{ image?: string; error?: string; status: number }> {
  const base = process.env.SD_BASE_URL?.replace(/\/$/, "");
  if (!base) return { error: "Image generation not configured (SD_BASE_URL)", status: 501 };
  const res = await fetch(`${base}/sdapi/v1/txt2img`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      negative_prompt: process.env.SD_NEGATIVE_PROMPT ?? "child, minor, underage, lowres, deformed",
      steps: Number(process.env.SD_STEPS ?? 25),
      width: 512,
      height: 704,
    }),
  });
  if (!res.ok) return { error: `Image generation failed (${res.status})`, status: 502 };
  const json = (await res.json()) as { images?: string[] };
  const b64 = json.images?.[0];
  return b64 ? { image: `data:image/png;base64,${b64}`, status: 200 } : { error: "No image returned", status: 502 };
}
