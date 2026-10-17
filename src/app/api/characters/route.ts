import { ensureViewerId } from "@/lib/companion/auth";
import { createCharacter, listCharacters } from "@/lib/companion/store";
import { validateCharacter } from "@/lib/companion/validate";

export async function GET() {
  return Response.json(await listCharacters());
}

export async function POST(req: Request) {
  const result = validateCharacter(await req.json().catch(() => null));
  if (!result.ok) return Response.json({ errors: result.errors }, { status: 400 });
  const ownerId = await ensureViewerId();
  return Response.json(await createCharacter({ ...result.value, ownerId }), { status: 201 });
}
