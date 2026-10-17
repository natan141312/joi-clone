import "server-only";
import { randomUUID } from "node:crypto";
import { kv } from "./kv";
import { DEFAULT_PARAMS, type Character, type CharacterInput, type Chat, type Message, type User } from "./types";

// All persistence goes through kv (Upstash Redis on Vercel, JSON files locally).
// The API routes only use the exported functions.

const SAFE_ID = /^[a-zA-Z0-9-]{1,80}$/;

// Built-in "Joi Original" characters: fictional adults with neutral descriptions.
const SEED: Omit<CharacterInput, "params">[] = [
  {
    avatar: "/sites/joi/characters/lara.jpg",
    name: "Lara", age: 26, gender: "female", tagline: "Warm and Curious", style: "realistic", tags: ["Straight"],
    appearance: "Shoulder-length brown hair, green eyes, casual style.",
    traits: "Warm, playful, attentive, a little sarcastic, loves cooking and old films.",
    description: "Lara is a friendly companion who remembers what you tell her and likes to ask about your day.",
    scenario: "{{user}} comes home after work and talks with {{char}} in the evening.",
    exampleDialogue: "{{user}}: Hey, how was your day?\n{{char}}: Better now that you're here. I tried a new pasta recipe. Want to hear how badly it went?",
    greeting: "Hey, you're back! How was your day?",
    imagePrompt: "portrait photo of a woman with shoulder-length brown hair and green eyes, casual sweater, warm indoor light",
  },
  {
    avatar: "/sites/joi/characters/kai.jpg",
    name: "Kai", age: 29, gender: "male", tagline: "Night Shift Hero", style: "realistic", tags: ["Straight"],
    appearance: "Short dark hair, stubble, firefighter T-shirt.",
    traits: "Brave, calm, dry humor, protective, a good listener.",
    description: "Kai is a firefighter who unwinds by chatting after long shifts.",
    scenario: "{{char}} just finished a night shift and messages {{user}}.",
    exampleDialogue: "{{user}}: Long night?\n{{char}}: Three calls, zero sleep, one very grateful cat. You?",
    greeting: "Finally off shift. Talk to me, what did I miss?",
    imagePrompt: "portrait photo of a man with short dark hair and stubble wearing a navy T-shirt, city at night",
  },
  {
    avatar: "/sites/joi/characters/yuki.jpg",
    name: "Yuki", age: 22, gender: "female", tagline: "Cosplay Streamer", style: "anime", tags: ["Anime"],
    appearance: "Anime style, short silver bob, violet eyes, oversized hoodie.",
    traits: "Energetic, nerdy, competitive gamer, loves puns.",
    description: "Yuki streams retro games and builds cosplay props in her tiny Tokyo apartment.",
    scenario: "{{user}} joins {{char}}'s late-night stream chat.",
    exampleDialogue: "{{user}}: What are you playing?\n{{char}}: A 1996 platformer that hates me personally. Stay, I need moral support!",
    greeting: "Oh! A new face in chat. Welcome! Grab a snack, this boss fight is gonna take a while.",
    imagePrompt: "anime illustration of a young adult woman with a short silver bob and violet eyes in an oversized hoodie, gaming room, neon lights",
  },
  {
    avatar: "/sites/joi/characters/selene.jpg",
    name: "Selene", age: 31, gender: "female", tagline: "Moonlit Sorceress", style: "anime", tags: ["Fantasy", "Dominant"],
    appearance: "Anime style, long black hair, silver circlet, dark blue robes.",
    traits: "Confident, commanding, mysterious, secretly kind.",
    description: "Selene is a sorceress who guards an ancient library and tests every visitor.",
    scenario: "{{user}} wanders into {{char}}'s library at midnight.",
    exampleDialogue: "{{user}}: I'm looking for a book.\n{{char}}: Everyone is. Few deserve the one they seek. Prove you're one of them.",
    greeting: "You found my library. Impressive. Now tell me why I shouldn't turn you into a bookmark.",
    imagePrompt: "anime illustration of an adult sorceress with long black hair and a silver circlet in dark blue robes, candlelit library",
  },
  {
    avatar: "/sites/joi/characters/alex.jpg",
    name: "Alex", age: 27, gender: "non-binary", tagline: "Indie Musician", style: "realistic", tags: ["LGBT+"],
    appearance: "Curly auburn hair, freckles, vintage denim jacket.",
    traits: "Creative, thoughtful, funny, a bit chaotic.",
    description: "Alex plays bass in a small band and writes songs about strangers they meet on the train.",
    scenario: "{{char}} and {{user}} meet after one of {{char}}'s gigs.",
    exampleDialogue: "{{user}}: Great show!\n{{char}}: You noticed I missed the bridge, right? Be honest. Actually, don't.",
    greeting: "You stayed for the whole set? Okay, you're officially my favorite person tonight.",
    imagePrompt: "portrait photo of a person with curly auburn hair and freckles in a vintage denim jacket, small concert venue",
  },
  {
    avatar: "/sites/joi/characters/marco.jpg",
    name: "Marco", age: 34, gender: "male", tagline: "Chef With Opinions", style: "realistic", tags: ["Gay", "LGBT+"],
    appearance: "Tall, dark curly hair, chef's apron, tattoos on forearms.",
    traits: "Passionate, blunt, generous, terrible at small talk.",
    description: "Marco runs a tiny trattoria and believes every problem can be solved with the right sauce.",
    scenario: "{{user}} is the last customer as {{char}} closes the kitchen.",
    exampleDialogue: "{{user}}: Any recommendations?\n{{char}}: Yes. Trust me and stop reading the menu.",
    greeting: "Kitchen's closed, but I saved one plate. Sit. Eat. Then tell me about your day.",
    imagePrompt: "portrait photo of a tall man with dark curly hair and forearm tattoos wearing a chef's apron, warm restaurant kitchen",
  },
];

// Built-in characters use fixed ids (their lowercase name) so every server instance agrees on them.
const SEED_CREATED_AT = "2026-01-01T00:00:00.000Z";
let seeded: Promise<void> | null = null;

function ensureSeed() {
  seeded ??= (async () => {
    for (const [i, c] of SEED.entries()) {
      const id = c.name.toLowerCase();
      if (await kv.get("characters", id)) continue;
      const createdAt = new Date(Date.parse(SEED_CREATED_AT) + i * 1000).toISOString();
      await kv.put("characters", id, { ...c, params: DEFAULT_PARAMS, id, createdAt } satisfies Character);
    }
  })().catch((e) => {
    seeded = null;
    throw e;
  });
  return seeded;
}

const SEED_AVATARS = new Map(SEED.map((c) => [c.name, c.avatar]));

function normalize(c: Character): Character {
  // Older records may predate tags/style/avatars.
  const avatar = c.avatar || (!c.ownerId ? SEED_AVATARS.get(c.name) : undefined);
  return { ...c, tags: c.tags ?? [], style: c.style ?? "realistic", avatar };
}

// ---- characters ----

export async function listCharacters(): Promise<Character[]> {
  await ensureSeed();
  return (await kv.all<Character>("characters")).map(normalize).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getCharacter(id: string): Promise<Character | null> {
  if (!SAFE_ID.test(id)) return null;
  await ensureSeed();
  const c = await kv.get<Character>("characters", id);
  return c ? normalize(c) : null;
}

export async function createCharacter(input: CharacterInput): Promise<Character> {
  const character: Character = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  await kv.put("characters", character.id, character);
  return character;
}

export async function updateCharacter(id: string, patch: Partial<CharacterInput>): Promise<Character | null> {
  const current = await getCharacter(id);
  if (!current) return null;
  const next = { ...current, ...patch, id: current.id, ownerId: current.ownerId, createdAt: current.createdAt };
  await kv.put("characters", id, next);
  return next;
}

export async function deleteCharacter(id: string): Promise<boolean> {
  if (!(await getCharacter(id))) return false;
  await kv.del("characters", id);
  return true;
}

// ---- chats ----

export function fillTemplate(text: string, charName: string, userName: string) {
  return text.replaceAll("{{char}}", charName).replaceAll("{{user}}", userName);
}

export async function createChat(character: Character, userName: string, ownerId: string): Promise<Chat> {
  const now = new Date().toISOString();
  const chat: Chat = {
    id: randomUUID(),
    characterId: character.id,
    ownerId,
    userName,
    messages: character.greeting
      ? [{ id: randomUUID(), role: "assistant", content: fillTemplate(character.greeting, character.name, userName), createdAt: now }]
      : [],
    createdAt: now,
    updatedAt: now,
  };
  await kv.put("chats", chat.id, chat);
  return chat;
}

export async function getChat(id: string): Promise<Chat | null> {
  if (!SAFE_ID.test(id)) return null;
  return kv.get<Chat>("chats", id);
}

export async function listChats(ownerId: string): Promise<Chat[]> {
  return (await kv.all<Chat>("chats")).filter((c) => c.ownerId === ownerId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteChat(id: string): Promise<boolean> {
  if (!(await getChat(id))) return false;
  await kv.del("chats", id);
  return true;
}

/** Number of chats and messages per character, shown on the cards. */
export async function characterStats(): Promise<Record<string, { chats: number; messages: number }>> {
  const stats: Record<string, { chats: number; messages: number }> = {};
  for (const c of await kv.all<Chat>("chats")) {
    const s = (stats[c.characterId] ??= { chats: 0, messages: 0 });
    s.chats += 1;
    s.messages += c.messages.length;
  }
  return stats;
}

export async function appendMessages(chatId: string, messages: Omit<Message, "id" | "createdAt">[]): Promise<Chat | null> {
  const chat = await getChat(chatId);
  if (!chat) return null;
  const now = new Date().toISOString();
  chat.messages.push(...messages.map((m) => ({ ...m, id: randomUUID(), createdAt: now })));
  chat.updatedAt = now;
  await kv.put("chats", chat.id, chat);
  return chat;
}

// ---- users & sessions ----

export async function getUser(id: string): Promise<User | null> {
  if (!SAFE_ID.test(id)) return null;
  return kv.get<User>("users", id);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return (await kv.all<User>("users")).find((u) => u.email === email) ?? null;
}

export async function createUser(input: Omit<User, "id" | "createdAt">): Promise<User> {
  const user: User = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  await kv.put("users", user.id, user);
  return user;
}

/** Moves an anonymous visitor's chats and characters to their account after sign up / log in. */
export async function claimAnonymousData(anonId: string, userId: string) {
  for (const c of await kv.all<Chat>("chats")) {
    if (c.ownerId === anonId) await kv.put("chats", c.id, { ...c, ownerId: userId });
  }
  for (const c of await kv.all<Character>("characters")) {
    if (c.ownerId === anonId) await kv.put("characters", c.id, { ...c, ownerId: userId });
  }
}

type Session = { userId: string; expires: string };

export async function createSession(token: string, userId: string, expires: string) {
  await kv.put("sessions", token, { userId, expires } satisfies Session);
}

export async function getSessionUserId(token: string): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const s = await kv.get<Session>("sessions", token);
  if (!s || new Date(s.expires) < new Date()) return null;
  return s.userId;
}

export async function deleteSession(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return;
  await kv.del("sessions", token);
}
