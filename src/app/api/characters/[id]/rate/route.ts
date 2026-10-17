import { ensureViewerId } from "@/lib/companion/auth";
import { characterStats, getCharacter, rateCharacter } from "@/lib/companion/store";

// POST { value: 1-5 } -> saves the viewer's rating and returns the new average.
export async function POST(req: Request, ctx: RouteContext<"/api/characters/[id]/rate">) {
  const { id } = await ctx.params;
  if (!(await getCharacter(id))) return Response.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { value?: unknown };
  const value = Number(body.value);
  if (!Number.isInteger(value) || value < 1 || value > 5) return Response.json({ error: "value must be 1-5" }, { status: 400 });
  await rateCharacter(id, await ensureViewerId(), value);
  const s = (await characterStats())[id];
  return Response.json({ value, rating: s?.rating ?? value, ratings: s?.ratings ?? 1 });
}
