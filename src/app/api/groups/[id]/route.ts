import { getViewerId } from "@/lib/companion/auth";
import { getGroup } from "@/lib/companion/groups";
import { kv } from "@/lib/companion/kv";

export async function GET(_req: Request, ctx: RouteContext<"/api/groups/[id]">) {
  const { id } = await ctx.params;
  const g = await getGroup(id);
  const viewer = await getViewerId();
  return g && g.ownerId === viewer ? Response.json(g) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/groups/[id]">) {
  const { id } = await ctx.params;
  const g = await getGroup(id);
  if (g && g.ownerId === (await getViewerId())) await kv.del("groups", id);
  return new Response(null, { status: 204 });
}
