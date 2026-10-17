// Character card fields follow the text-generation-webui / Tavern character format:
// name, persona (age, appearance, traits), description, scenario, example dialogue, greeting.

export type GenerationParams = {
  temperature: number;
  topP: number;
  maxTokens: number;
};

// Expertise categories (shown as the category filter on Explore).
export const CHARACTER_TAGS = [
  "Tech", "Business", "Finance", "Health", "Fitness", "Food", "Creative", "Music", "Education", "Law", "Science", "Lifestyle",
] as const;
export type CharacterTag = (typeof CHARACTER_TAGS)[number];

export type Character = {
  id: string;
  name: string;
  age: number;
  gender: string;
  tagline: string;
  /** The field this character is an expert in, e.g. "personal finance" or "React development". */
  expertise: string;
  /** Markdown knowledge sheet the model follows (built-in experts: content/experts/<id>.md). */
  profileMd?: string;
  appearance: string;
  traits: string;
  description: string;
  scenario: string;
  exampleDialogue: string;
  greeting: string;
  /** Image prompt used to generate pictures of this character. */
  imagePrompt: string;
  /** Data URL or /public path. */
  avatar?: string;
  /** ElevenLabs voice id. Falls back to ELEVENLABS_DEFAULT_VOICE. */
  voiceId?: string;
  params: GenerationParams;
  tags: CharacterTag[];
  style: "realistic" | "anime";
  /** User id of the creator; empty for built-in "PRO Original" characters. */
  ownerId?: string;
  createdAt: string;
};

export type CharacterInput = Omit<Character, "id" | "createdAt">;

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type PublicUser = Pick<User, "id" | "name" | "email">;

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Data URL of an attached (user) or generated (assistant) image. */
  image?: string;
  createdAt: string;
};

export type Chat = {
  id: string;
  characterId: string;
  /** Owner of the chat; anonymous visitors get a browser id cookie instead. */
  ownerId: string;
  userName: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_PARAMS: GenerationParams = { temperature: 0.8, topP: 0.9, maxTokens: 400 };
