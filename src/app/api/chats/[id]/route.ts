import { getOwnedChat } from "@/lib/companion/access";
import { deleteChat } from "@/lib/companion/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/chats/[id]">) {
  const { id } = await ctx.params;
  const owned = await getOwnedChat(id);
  return owned ? Response.json(owned) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/chats/[id]">) {
  const { id } = await ctx.params;
  if (!(await getOwnedChat(id))) return Response.json({ error: "Not found" }, { status: 404 });
  await deleteChat(id);
  return new Response(null, { status: 204 });
}
