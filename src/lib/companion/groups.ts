import "server-only";
import { randomUUID } from "node:crypto";
import { kv } from "./kv";
import { buildSystemPrompt, type LlmMessage } from "./prompt";
import { getCharacter } from "./store";
import type { Character, Group, GroupMessage } from "./types";

const SAFE_ID = /^[a-zA-Z0-9-]{1,80}$/;
export const MAX_MEMBERS = 6;

export async function getGroup(id: string) {
  return SAFE_ID.test(id) ? kv.get<Group>("groups", id) : null;
}

export async function saveGroup(g: Group) {
  await kv.put("groups", g.id, g);
}

export async function listGroups(ownerId: string) {
  return (await kv.all<Group>("groups")).filter((g) => g.ownerId === ownerId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function membersOf(ids: unknown): Promise<Character[]> {
  const list = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string").slice(0, MAX_MEMBERS) : [];
  const chars = await Promise.all([...new Set(list)].map((id) => getCharacter(id)));
  return chars.filter((c): c is Character => c !== null);
}

export function newGroup(id: string, ownerId: string, name: string, members: Character[]): Group {
  const now = new Date().toISOString();
  return {
    id,
    ownerId,
    name: name.trim().slice(0, 60) || members.map((m) => m.name).join(", "),
    memberIds: members.map((m) => m.id),
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Rebuilds history from the browser copy (Vercel without a database). */
export function sanitizeHistory(history: unknown, memberIds: string[]): GroupMessage[] {
  if (!Array.isArray(history)) return [];
  return history.slice(-80).flatMap((m) => {
    const x = (m ?? {}) as Record<string, unknown>;
    if (typeof x.content !== "string" || !x.content.trim()) return [];
    const role = x.role === "assistant" ? "assistant" : "user";
    const characterId = typeof x.characterId === "string" && memberIds.includes(x.characterId) ? x.characterId : undefined;
    if (role === "assistant" && !characterId) return [];
    return [{ id: randomUUID(), role, characterId, content: x.content.slice(0, 6000), createdAt: new Date().toISOString() }];
  });
}

/**
 * Messages for one expert's turn in a group. Other experts' messages are shown as
 * "[Name]: ..." user turns so every model sees the whole conversation.
 */
export function groupTurnMessages(
  me: Character,
  members: Character[],
  history: GroupMessage[],
  userName: string,
  userContext: string,
  mode: "answer" | "discuss",
): LlmMessage[] {
  const others = members.filter((m) => m.id !== me.id).map((m) => `${m.name} (${m.tagline})`);
  const groupRules = [
    `You are in a group chat with ${userName} and other experts: ${others.join(", ") || "none"}.`,
    "Answer from YOUR field of expertise only. Read what the other experts said; build on it, add what is missing, or politely disagree with reasons. Do not repeat what others already said.",
    "Address other experts by name when you respond to them. Keep it focused: 3-8 sentences unless a plan or widget is needed.",
    mode === "discuss" ? "This is a discussion round: respond mainly to the other experts' points and move toward a joint recommendation." : "",
  ]
    .filter(Boolean)
    .join("\n");
  const byId = new Map(members.map((m) => [m.id, m]));
  const msgs: LlmMessage[] = [{ role: "system", content: `${buildSystemPrompt(me, userName, userContext)}\n\n${groupRules}` }];
  let budget = 14000;
  const tail: LlmMessage[] = [];
  for (let i = history.length - 1; i >= 0 && budget > 0; i--) {
    const m = history[i];
    budget -= m.content.length;
    if (m.role === "user") tail.unshift({ role: "user", content: `[${userName}]: ${m.content}` });
    else if (m.characterId === me.id) tail.unshift({ role: "assistant", content: m.content });
    else tail.unshift({ role: "user", content: `[${byId.get(m.characterId ?? "")?.name ?? "Expert"}]: ${m.content}` });
  }
  return [...msgs, ...tail];
}
