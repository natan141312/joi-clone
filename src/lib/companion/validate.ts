import { CHARACTER_TAGS, DEFAULT_PARAMS, type CharacterInput, type CharacterTag } from "./types";

const LIMITS: Record<string, number> = {
  name: 60,
  gender: 40,
  tagline: 80,
  appearance: 2000,
  traits: 2000,
  description: 4000,
  scenario: 2000,
  exampleDialogue: 4000,
  greeting: 1000,
  imagePrompt: 1000,
  voiceId: 100,
};

const MAX_AVATAR_BYTES = 3_000_000;

export type ValidationResult = { ok: true; value: CharacterInput } | { ok: false; errors: string[] };

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function num(v: unknown, fallback: number, min: number, max: number) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/**
 * Validates a character payload. Characters must be adults (18+) and fictional;
 * the creator must confirm the character does not depict a real person.
 */
export function validateCharacter(body: unknown, { partial = false } = {}): ValidationResult {
  const b = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const out: Record<string, unknown> = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    if (partial && !(key in b)) continue;
    const value = str(b[key]);
    if (value.length > max) errors.push(`${key} must be at most ${max} characters`);
    out[key] = value;
  }

  if (!partial || "name" in b) {
    if (!out.name) errors.push("name is required");
  }

  if (!partial || "age" in b) {
    const age = Number(b.age);
    if (!Number.isInteger(age) || age < 18 || age > 120) errors.push("age must be a whole number of 18 or more");
    out.age = age;
  }

  if (!partial) {
    if (b.fictionalConfirmed !== true) errors.push("confirm the character is fictional and not based on a real person");
  }

  if (!partial || "avatar" in b) {
    const avatar = str(b.avatar);
    if (avatar && !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(avatar) && !avatar.startsWith("/")) {
      errors.push("avatar must be an image data URL or a local path");
    }
    if (avatar.length > MAX_AVATAR_BYTES) errors.push("avatar image is too large (max ~2MB)");
    out.avatar = avatar || undefined;
  }

  if (!partial || "params" in b) {
    const p = (b.params ?? {}) as Record<string, unknown>;
    out.params = {
      temperature: num(p.temperature, DEFAULT_PARAMS.temperature, 0, 2),
      topP: num(p.topP, DEFAULT_PARAMS.topP, 0, 1),
      maxTokens: Math.round(num(p.maxTokens, DEFAULT_PARAMS.maxTokens, 16, 4000)),
    };
  }

  if (!partial || "tags" in b) {
    const tags = Array.isArray(b.tags) ? b.tags : [];
    out.tags = [...new Set(tags.filter((t): t is CharacterTag => CHARACTER_TAGS.includes(t as CharacterTag)))];
  }

  if (!partial || "style" in b) {
    out.style = b.style === "anime" ? "anime" : "realistic";
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out as CharacterInput };
}
