import { getCharacter, getChat } from "@/lib/companion/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/chats/[id]">) {
  const { id } = await ctx.params;
  const chat = await getChat(id);
  if (!chat) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ chat, character: await getCharacter(chat.characterId) });
}
