import { deleteCharacter, getCharacter, updateCharacter } from "@/lib/companion/store";
import { validateCharacter } from "@/lib/companion/validate";

export async function GET(_req: Request, ctx: RouteContext<"/api/characters/[id]">) {
  const { id } = await ctx.params;
  const character = await getCharacter(id);
  return character ? Response.json(character) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/characters/[id]">) {
  const { id } = await ctx.params;
  const result = validateCharacter(await req.json().catch(() => null), { partial: true });
  if (!result.ok) return Response.json({ errors: result.errors }, { status: 400 });
  const updated = await updateCharacter(id, result.value);
  return updated ? Response.json(updated) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/characters/[id]">) {
  const { id } = await ctx.params;
  return (await deleteCharacter(id)) ? new Response(null, { status: 204 }) : Response.json({ error: "Not found" }, { status: 404 });
}
