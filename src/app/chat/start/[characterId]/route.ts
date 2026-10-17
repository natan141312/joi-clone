import { redirect } from "next/navigation";
import { createChat, getCharacter } from "@/lib/companion/store";

// Clicking a character card starts a new chat and opens it.
export async function GET(_req: Request, ctx: RouteContext<"/chat/start/[characterId]">) {
  const { characterId } = await ctx.params;
  const character = await getCharacter(characterId);
  if (!character) return Response.json({ error: "Unknown character" }, { status: 404 });
  const chat = await createChat(character, "You");
  redirect(`/chat/${chat.id}`);
}
