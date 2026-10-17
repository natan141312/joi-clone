// Browser copy of the viewer's expert groups (works without a database; see local-chats.ts).
import type { GroupMessage } from "@/lib/companion/types";

export type LocalGroup = { id: string; name: string; memberIds: string[]; messages: GroupMessage[]; updatedAt: string };

const KEY = "pro_groups";

export function readLocalGroups(): LocalGroup[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]") as LocalGroup[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveLocalGroup(g: LocalGroup) {
  try {
    const list = readLocalGroups().filter((x) => x.id !== g.id);
    list.unshift({ ...g, messages: g.messages.slice(-120) });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // storage full or blocked
  }
}

export function removeLocalGroup(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(readLocalGroups().filter((g) => g.id !== id)));
  } catch {
    // ignore
  }
}
