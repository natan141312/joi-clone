import { generateImage } from "@/lib/companion/media";
import { getOwnedChat } from "@/lib/companion/access";
import { appendMessages } from "@/lib/companion/store";

// POST { prompt? } -> the character "sends a picture": generated from the character's imagePrompt plus the request.
export async function POST(req: Request, ctx: RouteContext<"/api/chats/[id]/image">) {
  const { id } = await ctx.params;
  const owned = await getOwnedChat(id);
  if (!owned) return Response.json({ error: "Chat not found" }, { status: 404 });
  const { character } = owned;

  const body = (await req.json().catch(() => ({}))) as { prompt?: string };
  const extra = (body.prompt ?? "").trim().slice(0, 300);
  const prompt = [character.imagePrompt, `adult, ${character.age} years old`, extra].filter(Boolean).join(", ");
  const result = await generateImage(prompt);
  if (!result.image) return Response.json({ error: result.error }, { status: result.status });

  const updated = await appendMessages(id, [{ role: "assistant", content: "", image: result.image }]);
  return Response.json(updated?.messages.at(-1), { status: 201 });
}
