// Browser-side index of the viewer's chats. Keeps the chat list working even when the server
// copy is gone (Vercel without a database). With Redis connected the server list is complete too.

export type LocalChat = {
  id: string;
  characterId: string;
  name: string;
  tagline: string;
  avatar?: string;
  last: string;
  updatedAt: string;
};

const KEY = "pro_chats_index";

export function readLocalChats(): LocalChat[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]") as LocalChat[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveLocalChat(entry: LocalChat) {
  try {
    const list = readLocalChats().filter((c) => c.id !== entry.id);
    // Data URLs are too big for the index; keep only file/URL avatars.
    const avatar = entry.avatar && !entry.avatar.startsWith("data:") ? entry.avatar : undefined;
    list.unshift({ ...entry, avatar, last: entry.last.slice(0, 160) });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    // Storage full or blocked: the server list still works.
  }
}

export function removeLocalChat(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(readLocalChats().filter((c) => c.id !== id)));
    localStorage.removeItem(`joi_chat_${id}`);
  } catch {
    // ignore
  }
}
