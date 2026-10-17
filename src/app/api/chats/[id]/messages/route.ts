import { llmConfig, streamChat } from "@/lib/companion/llm";
import { buildMessages } from "@/lib/companion/prompt";
import { appendMessages, getCharacter } from "@/lib/companion/store";

const MAX_TEXT = 4000;
const MAX_IMAGE = 4_000_000;

// POST { text, image? } -> streams the character's reply as text/plain, then saves both messages.
export async function POST(req: Request, ctx: RouteContext<"/api/chats/[id]/messages">) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { text?: string; image?: string };
  const text = (body.text ?? "").trim().slice(0, MAX_TEXT);
  const image = typeof body.image === "string" && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(body.image) && body.image.length <= MAX_IMAGE ? body.image : undefined;
  if (!text && !image) return Response.json({ error: "Message is empty" }, { status: 400 });

  const chat = await appendMessages(id, [{ role: "user", content: text, image }]);
  if (!chat) return Response.json({ error: "Chat not found" }, { status: 404 });
  const character = await getCharacter(chat.characterId);
  if (!character) return Response.json({ error: "Character not found" }, { status: 404 });

  let chunks: AsyncIterable<string>;
  try {
    chunks = await streamChat(buildMessages(character, chat, { vision: llmConfig.vision }), character.params, req.signal);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let reply = "";
      try {
        for await (const chunk of chunks) {
          reply += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        controller.enqueue(encoder.encode(`\n[error: ${(e as Error).message}]`));
      } finally {
        if (reply.trim()) await appendMessages(id, [{ role: "assistant", content: reply.trim() }]);
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
