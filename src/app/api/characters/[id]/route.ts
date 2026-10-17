import { getViewerId } from "@/lib/companion/auth";
import { deleteCharacter, getCharacter, updateCharacter } from "@/lib/companion/store";
import { validateCharacter } from "@/lib/companion/validate";

export async function GET(_req: Request, ctx: RouteContext<"/api/characters/[id]">) {
  const { id } = await ctx.params;
  const character = await getCharacter(id);
  return character ? Response.json(character) : Response.json({ error: "Not found" }, { status: 404 });
}

async function ownedCharacter(id: string) {
  const character = await getCharacter(id);
  if (!character) return { error: Response.json({ error: "Not found" }, { status: 404 }) };
  const viewer = await getViewerId();
  if (!character.ownerId || character.ownerId !== viewer) {
    return { error: Response.json({ error: "Only the creator can change this character" }, { status: 403 }) };
  }
  return { character };
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/characters/[id]">) {
  const { id } = await ctx.params;
  const owned = await ownedCharacter(id);
  if (owned.error) return owned.error;
  const result = validateCharacter(await req.json().catch(() => null), { partial: true });
  if (!result.ok) return Response.json({ errors: result.errors }, { status: 400 });
  return Response.json(await updateCharacter(id, result.value));
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/characters/[id]">) {
  const { id } = await ctx.params;
  const owned = await ownedCharacter(id);
  if (owned.error) return owned.error;
  await deleteCharacter(id);
  return new Response(null, { status: 204 });
}
