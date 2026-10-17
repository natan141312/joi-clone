import "server-only";
import { ensureViewerId, getCurrentUser, getViewerId } from "./auth";
import { getCharacter, getChat, restoreChat } from "./store";

/** Loads a chat only if it belongs to the current viewer (signed-in user or anonymous browser). */
export async function getOwnedChat(id: string) {
  const chat = await getChat(id);
  if (!chat) return null;
  const viewer = await getViewerId();
  if (!viewer || chat.ownerId !== viewer) return null;
  const character = await getCharacter(chat.characterId);
  return character ? { chat, character } : null;
}

/**
 * Like getOwnedChat, but when the chat does not exist on this server it is rebuilt from the
 * browser's copy ({ characterId, history }). Chats owned by someone else are never touched.
 * Route handlers only (may set the anonymous id cookie).
 */
export async function getOrRestoreChat(id: string, body: { characterId?: unknown; history?: unknown }) {
  const owned = await getOwnedChat(id);
  if (owned) return owned;
  if (await getChat(id)) return null;
  const character = typeof body.characterId === "string" ? await getCharacter(body.characterId) : null;
  if (!character) return null;
  const ownerId = await ensureViewerId();
  const user = await getCurrentUser();
  const chat = await restoreChat(id, character, user?.name ?? "friend", ownerId, body.history);
  return chat ? { chat, character } : null;
}
