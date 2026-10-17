import { redirect } from "next/navigation";
import { ensureViewerId, getCurrentUser } from "@/lib/companion/auth";
import { createChat, getCharacter } from "@/lib/companion/store";

// Clicking a character card starts a new chat and opens it.
export async function GET(_req: Request, ctx: RouteContext<"/chat/start/[characterId]">) {
  const { characterId } = await ctx.params;
  const character = await getCharacter(characterId);
  // Stale or deleted link: go back to Explore instead of showing a raw error.
  if (!character) redirect("/?gender=any");
  const ownerId = await ensureViewerId();
  const user = await getCurrentUser();
  const chat = await createChat(character, user?.name ?? "friend", ownerId);
  // ?c= lets the chat page rebuild the chat if another server instance handles the next request.
  redirect(`/chat/${chat.id}?c=${character.id}`);
}
