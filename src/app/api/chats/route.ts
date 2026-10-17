import { ensureViewerId, getCurrentUser, getViewerId } from "@/lib/companion/auth";
import { createChat, getCharacter, listChats } from "@/lib/companion/store";

export async function GET() {
  const viewer = await getViewerId();
  return Response.json(viewer ? await listChats(viewer) : []);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { characterId?: string };
  const character = body.characterId ? await getCharacter(body.characterId) : null;
  if (!character) return Response.json({ error: "Unknown character" }, { status: 404 });
  const ownerId = await ensureViewerId();
  const user = await getCurrentUser();
  return Response.json(await createChat(character, user?.name ?? "friend", ownerId), { status: 201 });
}
