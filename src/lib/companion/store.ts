import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DEFAULT_PARAMS, type Character, type CharacterInput, type Chat, type Message, type User } from "./types";

// Local JSON storage under data/companion/{characters,chats,users,sessions}/<id>.json.
// Swap this module for a database later; the API routes only use the exported functions.
// Serverless hosts (Vercel) only allow writes under /tmp, and that storage is temporary per instance.
const ROOT =
  process.env.COMPANION_DATA_DIR ??
  (process.env.VERCEL ? path.join(tmpdir(), "companion") : path.join(process.cwd(), "data", "companion"));
const CHAR_DIR = path.join(ROOT, "characters");
const CHAT_DIR = path.join(ROOT, "chats");
const USER_DIR = path.join(ROOT, "users");
const SESSION_DIR = path.join(ROOT, "sessions");

const SAFE_ID = /^[a-zA-Z0-9-]{1,80}$/;

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function writeJson(file: string, data: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, file);
}

async function readAll<T>(dir: string): Promise<T[]> {
  await mkdir(dir, { recursive: true });
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  const all = await Promise.all(files.map((f) => readJson<T>(path.join(dir, f))));
  return all.filter((x): x is Awaited<T> => x !== null) as T[];
}

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

async function ensureSeed() {
  await mkdir(CHAR_DIR, { recursive: true });
  const files = await readdir(CHAR_DIR);
  if (files.some((f) => f.endsWith(".json"))) return;
  for (const c of SEED) await createCharacter({ ...c, params: DEFAULT_PARAMS });
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
  return (await readAll<Character>(CHAR_DIR)).map(normalize).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getCharacter(id: string): Promise<Character | null> {
  if (!SAFE_ID.test(id)) return null;
  await ensureSeed();
  const c = await readJson<Character>(path.join(CHAR_DIR, `${id}.json`));
  return c ? normalize(c) : null;
}

export async function createCharacter(input: CharacterInput): Promise<Character> {
  const character: Character = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  await writeJson(path.join(CHAR_DIR, `${character.id}.json`), character);
  return character;
}

export async function updateCharacter(id: string, patch: Partial<CharacterInput>): Promise<Character | null> {
  const current = await getCharacter(id);
  if (!current) return null;
  const next = { ...current, ...patch, id: current.id, ownerId: current.ownerId, createdAt: current.createdAt };
  await writeJson(path.join(CHAR_DIR, `${id}.json`), next);
  return next;
}

export async function deleteCharacter(id: string): Promise<boolean> {
  if (!(await getCharacter(id))) return false;
  await rm(path.join(CHAR_DIR, `${id}.json`));
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
  await writeJson(path.join(CHAT_DIR, `${chat.id}.json`), chat);
  return chat;
}

export async function getChat(id: string): Promise<Chat | null> {
  if (!SAFE_ID.test(id)) return null;
  return readJson<Chat>(path.join(CHAT_DIR, `${id}.json`));
}

export async function listChats(ownerId: string): Promise<Chat[]> {
  return (await readAll<Chat>(CHAT_DIR)).filter((c) => c.ownerId === ownerId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteChat(id: string): Promise<boolean> {
  if (!(await getChat(id))) return false;
  await rm(path.join(CHAT_DIR, `${id}.json`));
  return true;
}

/** Number of chats and messages per character, shown on the cards. */
export async function characterStats(): Promise<Record<string, { chats: number; messages: number }>> {
  const stats: Record<string, { chats: number; messages: number }> = {};
  for (const c of await readAll<Chat>(CHAT_DIR)) {
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
  await writeJson(path.join(CHAT_DIR, `${chat.id}.json`), chat);
  return chat;
}

// ---- users & sessions ----

export async function getUser(id: string): Promise<User | null> {
  if (!SAFE_ID.test(id)) return null;
  return readJson<User>(path.join(USER_DIR, `${id}.json`));
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return (await readAll<User>(USER_DIR)).find((u) => u.email === email) ?? null;
}

export async function createUser(input: Omit<User, "id" | "createdAt">): Promise<User> {
  const user: User = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  await writeJson(path.join(USER_DIR, `${user.id}.json`), user);
  return user;
}

/** Moves an anonymous visitor's chats and characters to their account after sign up / log in. */
export async function claimAnonymousData(anonId: string, userId: string) {
  for (const c of await readAll<Chat>(CHAT_DIR)) {
    if (c.ownerId === anonId) await writeJson(path.join(CHAT_DIR, `${c.id}.json`), { ...c, ownerId: userId });
  }
  for (const c of await readAll<Character>(CHAR_DIR)) {
    if (c.ownerId === anonId) await writeJson(path.join(CHAR_DIR, `${c.id}.json`), { ...c, ownerId: userId });
  }
}

type Session = { userId: string; expires: string };

export async function createSession(token: string, userId: string, expires: string) {
  await writeJson(path.join(SESSION_DIR, `${token}.json`), { userId, expires } satisfies Session);
}

export async function getSessionUserId(token: string): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const s = await readJson<Session>(path.join(SESSION_DIR, `${token}.json`));
  if (!s || new Date(s.expires) < new Date()) return null;
  return s.userId;
}

export async function deleteSession(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return;
  await rm(path.join(SESSION_DIR, `${token}.json`), { force: true });
}
