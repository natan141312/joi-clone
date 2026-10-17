import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DEFAULT_PARAMS, type Character, type CharacterInput, type Chat, type Message } from "./types";

// Local JSON storage: data/companion/characters/<id>.json and data/companion/chats/<id>.json.
// Swap this module for a database later; the API routes only use the exported functions.
// Serverless hosts (Vercel) only allow writes under /tmp, and that storage is temporary per instance.
const ROOT =
  process.env.COMPANION_DATA_DIR ??
  (process.env.VERCEL ? path.join(tmpdir(), "companion") : path.join(process.cwd(), "data", "companion"));
const CHAR_DIR = path.join(ROOT, "characters");
const CHAT_DIR = path.join(ROOT, "chats");

const SAFE_ID = /^[a-zA-Z0-9-]{1,64}$/;

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
  const { rename } = await import("node:fs/promises");
  await rename(tmp, file);
}

const SEED: CharacterInput[] = [
  {
    name: "Lara",
    age: 26,
    gender: "female",
    tagline: "Warm and Curious",
    appearance: "Shoulder-length brown hair, green eyes, casual style.",
    traits: "Warm, playful, attentive, a little sarcastic, loves cooking and old films.",
    description: "Lara is a friendly companion who remembers what you tell her and likes to ask about your day.",
    scenario: "{{user}} comes home after work and talks with {{char}} in the evening.",
    exampleDialogue: "{{user}}: Hey, how was your day?\n{{char}}: Honestly? Better now that you're here. I tried a new pasta recipe. Want to hear how badly it went?",
    greeting: "Hey, you're back! How was your day?",
    imagePrompt: "portrait photo of a woman with shoulder-length brown hair and green eyes, casual sweater, warm indoor light",
    params: DEFAULT_PARAMS,
  },
  {
    name: "Kai",
    age: 29,
    gender: "male",
    tagline: "Night Shift Hero",
    appearance: "Short dark hair, stubble, firefighter T-shirt.",
    traits: "Brave, calm, dry humor, protective, a good listener.",
    description: "Kai is a firefighter who unwinds by chatting after long shifts.",
    scenario: "{{char}} just finished a night shift and messages {{user}}.",
    exampleDialogue: "{{user}}: Long night?\n{{char}}: Three calls, zero sleep, one very grateful cat. You?",
    greeting: "Finally off shift. Talk to me, what did I miss?",
    imagePrompt: "portrait photo of a man with short dark hair and stubble wearing a navy T-shirt, city at night",
    params: DEFAULT_PARAMS,
  },
];

async function ensureSeed() {
  await mkdir(CHAR_DIR, { recursive: true });
  const files = await readdir(CHAR_DIR);
  if (files.some((f) => f.endsWith(".json"))) return;
  for (const c of SEED) await createCharacter(c);
}

export async function listCharacters(): Promise<Character[]> {
  await ensureSeed();
  const files = (await readdir(CHAR_DIR)).filter((f) => f.endsWith(".json"));
  const all = await Promise.all(files.map((f) => readJson<Character>(path.join(CHAR_DIR, f))));
  return all.filter((c): c is Character => c !== null).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getCharacter(id: string): Promise<Character | null> {
  if (!SAFE_ID.test(id)) return null;
  await ensureSeed();
  return readJson<Character>(path.join(CHAR_DIR, `${id}.json`));
}

export async function createCharacter(input: CharacterInput): Promise<Character> {
  const character: Character = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  await writeJson(path.join(CHAR_DIR, `${character.id}.json`), character);
  return character;
}

export async function updateCharacter(id: string, patch: Partial<CharacterInput>): Promise<Character | null> {
  const current = await getCharacter(id);
  if (!current) return null;
  const next = { ...current, ...patch, id: current.id, createdAt: current.createdAt };
  await writeJson(path.join(CHAR_DIR, `${id}.json`), next);
  return next;
}

export async function deleteCharacter(id: string): Promise<boolean> {
  if (!(await getCharacter(id))) return false;
  await rm(path.join(CHAR_DIR, `${id}.json`));
  return true;
}

export function fillTemplate(text: string, charName: string, userName: string) {
  return text.replaceAll("{{char}}", charName).replaceAll("{{user}}", userName);
}

export async function createChat(character: Character, userName: string): Promise<Chat> {
  const now = new Date().toISOString();
  const chat: Chat = {
    id: randomUUID(),
    characterId: character.id,
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

export async function listChats(): Promise<Chat[]> {
  await mkdir(CHAT_DIR, { recursive: true });
  const files = (await readdir(CHAT_DIR)).filter((f) => f.endsWith(".json"));
  const all = await Promise.all(files.map((f) => readJson<Chat>(path.join(CHAT_DIR, f))));
  return all.filter((c): c is Chat => c !== null).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
