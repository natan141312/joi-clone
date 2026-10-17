import { createChat, getCharacter, listChats } from "@/lib/companion/store";

export async function GET() {
  return Response.json(await listChats());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { characterId?: string; userName?: string };
  const character = body.characterId ? await getCharacter(body.characterId) : null;
  if (!character) return Response.json({ error: "Unknown character" }, { status: 404 });
  const userName = (body.userName ?? "").trim().slice(0, 40) || "You";
  return Response.json(await createChat(character, userName), { status: 201 });
}
