import { ensureViewerId } from "@/lib/companion/auth";
import { generateImage } from "@/lib/companion/media";
import { createCharacter, listCharacters } from "@/lib/companion/store";
import { validateCharacter } from "@/lib/companion/validate";

export async function GET() {
  return Response.json(await listCharacters());
}

export async function POST(req: Request) {
  const result = validateCharacter(await req.json().catch(() => null));
  if (!result.ok) return Response.json({ errors: result.errors }, { status: 400 });
  const ownerId = await ensureViewerId();
  const input = { ...result.value, ownerId };
  // No uploaded picture: generate a portrait once and store it (best effort).
  if (!input.avatar) {
    const prompt = input.imagePrompt || `${input.style === "anime" ? "anime illustration" : "portrait photo"} of ${input.name}, ${input.appearance}`;
    const generated = await generateImage(`${prompt}, adult, ${input.age} years old`).catch(() => null);
    if (generated?.image) input.avatar = generated.image;
  }
  return Response.json(await createCharacter(input), { status: 201 });
}
