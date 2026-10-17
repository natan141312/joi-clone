// Character card fields follow the text-generation-webui / Tavern character format:
// name, persona (age, appearance, traits), description, scenario, example dialogue, greeting.

export type GenerationParams = {
  temperature: number;
  topP: number;
  maxTokens: number;
};

export type Character = {
  id: string;
  name: string;
  age: number;
  gender: string;
  tagline: string;
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
  createdAt: string;
};

export type CharacterInput = Omit<Character, "id" | "createdAt">;

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
  userName: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_PARAMS: GenerationParams = { temperature: 0.8, topP: 0.9, maxTokens: 400 };
