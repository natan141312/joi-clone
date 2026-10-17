import "server-only";
import { getViewerId } from "./auth";
import { getCharacter, getChat } from "./store";

/** Loads a chat only if it belongs to the current viewer (signed-in user or anonymous browser). */
export async function getOwnedChat(id: string) {
  const chat = await getChat(id);
  if (!chat) return null;
  const viewer = await getViewerId();
  if (!viewer || chat.ownerId !== viewer) return null;
  const character = await getCharacter(chat.characterId);
  return character ? { chat, character } : null;
}
