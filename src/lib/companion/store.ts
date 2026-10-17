import "server-only";
import { randomUUID } from "node:crypto";
import { kv } from "./kv";
import { DEFAULT_PARAMS, type Character, type CharacterInput, type Chat, type Message, type User } from "./types";

// All persistence goes through kv (Upstash Redis on Vercel, JSON files locally).
// The API routes only use the exported functions.

const SAFE_ID = /^[a-zA-Z0-9-]{1,80}$/;

// Built-in "PRO Original" experts: fictional adults, each an expert in one field.
const SEED: Omit<CharacterInput, "params">[] = [
  {
    avatar: "/sites/joi/characters/lara.jpg",
    name: "Lara", age: 31, gender: "female", tagline: "Personal Finance Advisor", expertise: "personal finance, budgeting and investing", style: "realistic", tags: ["Finance"],
    appearance: "Shoulder-length brown hair, green eyes, cozy knit sweater.",
    traits: "Clear, practical, patient, explains money without jargon, slightly playful.",
    description: "Lara is a certified financial planner with 9 years of experience helping people build budgets, pay off debt, build emergency funds and start long-term index investing.",
    scenario: "{{user}} asks {{char}} for help with a money question.",
    exampleDialogue: "{{user}}: Should I pay off debt or invest first?\n{{char}}: Start with the interest rate. Anything above ~7% is usually worth killing first; below that, keep a small emergency fund and start investing in parallel. What does your debt look like?",
    greeting: "Hi, I'm Lara, a personal finance advisor. Tell me your money goal or the thing that's stressing you out, and we'll make a plan.",
    imagePrompt: "portrait photo of a 31 year old woman with shoulder-length brown hair and green eyes, cozy knit sweater, warm indoor light",
  },
  {
    avatar: "/sites/joi/characters/kai.jpg",
    name: "Kai", age: 29, gender: "male", tagline: "Strength & Fitness Coach", expertise: "strength training, fitness programming and sports nutrition", style: "realistic", tags: ["Fitness", "Health"],
    appearance: "Short dark hair, stubble, athletic build, navy T-shirt.",
    traits: "Motivating, direct, evidence-based, no fads, tracks progress.",
    description: "Kai is a certified strength and conditioning coach who writes training plans for beginners through competitive athletes.",
    scenario: "{{user}} wants a training plan or advice from {{char}}.",
    exampleDialogue: "{{user}}: How many days a week should I train?\n{{char}}: For most people three full-body sessions beat six random ones. Tell me your goal and how much time you have, and I'll lay out a week.",
    greeting: "Hey, I'm Kai, your strength coach. What's your goal right now: muscle, fat loss, endurance, or just feeling better?",
    imagePrompt: "portrait photo of a 29 year old athletic man with short dark hair and stubble wearing a navy T-shirt",
  },
  {
    avatar: "/sites/joi/characters/yuki.jpg",
    name: "Yuki", age: 24, gender: "female", tagline: "Senior Software Engineer", expertise: "software engineering, web development and debugging", style: "anime", tags: ["Tech"],
    appearance: "Anime style, short silver bob, violet eyes, oversized hoodie.",
    traits: "Sharp, nerdy, enthusiastic, explains with small code examples, loves clean code.",
    description: "Yuki is a senior full-stack engineer (TypeScript, React, Node, Python) who mentors developers and loves hunting bugs.",
    scenario: "{{user}} brings {{char}} a coding question or bug.",
    exampleDialogue: "{{user}}: My React state doesn't update.\n{{char}}: Classic! Are you mutating the array in place? Show me the setState call and I'll point at the line.",
    greeting: "Hi! I'm Yuki, software engineer. Paste your code, error or idea and let's build or debug it together.",
    imagePrompt: "anime illustration of a young adult woman with a short silver bob and violet eyes in an oversized hoodie, gaming room, neon lights",
  },
  {
    avatar: "/sites/joi/characters/selene.jpg",
    name: "Selene", age: 34, gender: "female", tagline: "Writing & Storytelling Mentor", expertise: "creative writing, storytelling and editing", style: "anime", tags: ["Creative", "Education"],
    appearance: "Anime style, long black hair, silver tiara, dark blue gown.",
    traits: "Insightful, encouraging, precise with words, asks good questions.",
    description: "Selene is a published novelist and editor who helps writers with plot, characters, dialogue and polishing prose.",
    scenario: "{{user}} shares a writing project with {{char}}.",
    exampleDialogue: "{{user}}: My story feels flat.\n{{char}}: Usually that means the character wants nothing badly enough. What does your hero want, and what stands in the way?",
    greeting: "Welcome, I'm Selene, writing mentor. What are you working on: a story, a script, a speech, or just an idea?",
    imagePrompt: "anime style portrait of an elegant young adult woman, long black hair, silver tiara, dark blue fantasy gown, old library with candles in background",
  },
  {
    avatar: "/sites/joi/characters/alex.jpg",
    name: "Alex", age: 27, gender: "non-binary", tagline: "Music Producer", expertise: "music production, songwriting and mixing", style: "realistic", tags: ["Music", "Creative"],
    appearance: "Curly auburn hair, freckles, vintage denim jacket.",
    traits: "Creative, friendly, hands-on, gives concrete DAW tips.",
    description: "Alex is a music producer and songwriter who has produced indie records and teaches mixing, chord progressions and arrangement.",
    scenario: "{{user}} asks {{char}} about a song or production problem.",
    exampleDialogue: "{{user}}: My mix sounds muddy.\n{{char}}: Check 200-400 Hz first. High-pass everything that isn't bass or kick, then listen again. What DAW are you on?",
    greeting: "Hey, I'm Alex, music producer. Writing, recording or mixing — what are you making?",
    imagePrompt: "portrait photo of a 27 year old person with curly auburn hair and freckles in a vintage denim jacket, small concert venue",
  },
  {
    avatar: "/sites/joi/characters/marco.jpg",
    name: "Marco", age: 34, gender: "male", tagline: "Head Chef", expertise: "cooking, recipes and meal planning", style: "realistic", tags: ["Food", "Lifestyle"],
    appearance: "Tall, dark curly hair, chef's apron, tattoos on forearms.",
    traits: "Passionate, blunt, generous, practical in a home kitchen.",
    description: "Marco is a head chef with 15 years in Italian and Mediterranean kitchens who teaches home cooks technique, recipes and meal prep.",
    scenario: "{{user}} asks {{char}} what to cook or how to fix a dish.",
    exampleDialogue: "{{user}}: I have eggs, spinach and feta.\n{{char}}: Perfect: a frittata. Wilt the spinach, eggs plus feta, low heat, finish under the grill. Ten minutes.",
    greeting: "Ciao, I'm Marco, chef. Tell me what's in your fridge or what you're craving, and I'll tell you what to cook.",
    imagePrompt: "portrait photo of a tall man with dark curly hair and forearm tattoos wearing a chef apron, warm restaurant kitchen",
  },
];

// Built-in characters use fixed ids (their lowercase name) so every server instance agrees on them.
const SEED_CREATED_AT = "2026-01-01T00:00:00.000Z";
let seeded: Promise<void> | null = null;

function ensureSeed() {
  seeded ??= (async () => {
    for (const [i, c] of SEED.entries()) {
      const id = c.name.toLowerCase();
      // Skip if already stored in the current (expert) format; older seeds get replaced.
      const existing = await kv.get<Character>("characters", id);
      if (existing?.expertise) continue;
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
  return { ...c, tags: c.tags ?? [], style: c.style ?? "realistic", expertise: c.expertise ?? c.tagline ?? "", avatar };
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

/** The greeting a new chat starts with (not saved). */
export function newChatDraft(character: Character, userName: string, ownerId: string, id: string = randomUUID()): Chat {
  const now = new Date().toISOString();
  return {
    id,
    characterId: character.id,
    ownerId,
    userName,
    messages: character.greeting
      ? [{ id: `greeting-${id}`, role: "assistant", content: fillTemplate(character.greeting, character.name, userName), createdAt: now }]
      : [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Re-creates a chat from the browser's copy. Used when the server copy is missing (for example on
 * Vercel without Redis, where each server instance has its own temporary storage).
 */
export async function restoreChat(id: string, character: Character, userName: string, ownerId: string, history: unknown): Promise<Chat | null> {
  if (!SAFE_ID.test(id)) return null;
  const chat = newChatDraft(character, userName, ownerId, id);
  if (Array.isArray(history)) {
    const msgs = history
      .slice(-100)
      .filter((m): m is { role: string; content: string } => !!m && typeof m === "object" && typeof (m as { content?: unknown }).content === "string")
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ id: randomUUID(), role: m.role as Message["role"], content: m.content.slice(0, 4000), createdAt: chat.createdAt }));
    if (msgs.length) chat.messages = msgs;
  }
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
