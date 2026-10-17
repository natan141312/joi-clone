import type { Character } from "./types";

// Free keyless image generation (Pollinations). safe=true keeps results non-explicit.
// Rate-limited to about one image per 45s, so never hotlink it for page images; generate once and store.
export function freeImageUrl(prompt: string, seed: number, width = 458, height = 636) {
  const q = new URLSearchParams({ width: String(width), height: String(height), seed: String(seed), nologo: "true", safe: "true" });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 500))}?${q}`;
}

/** Stored avatar (bundled file or uploaded/generated data URL); undefined shows the gradient placeholder. */
export function avatarFor(c: Pick<Character, "avatar">) {
  return c.avatar || undefined;
}
