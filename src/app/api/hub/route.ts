import { ensureViewerId, getViewerId } from "@/lib/companion/auth";
import { EMPTY_HUB, sanitizeHub, type Hub } from "@/lib/companion/hub";
import { kv } from "@/lib/companion/kv";

// GET -> the viewer's hub (server copy). PUT { hub } -> saves it if newer than the server copy.
export async function GET() {
  const viewer = await getViewerId();
  const hub = viewer ? await kv.get<Hub>("hubs", viewer) : null;
  return Response.json({ hub: hub ?? EMPTY_HUB, persistent: kv.persistent });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { hub?: unknown };
  const incoming = sanitizeHub(body.hub);
  const viewer = await ensureViewerId();
  const current = await kv.get<Hub>("hubs", viewer);
  if (current && current.updatedAt > incoming.updatedAt) return Response.json({ hub: current, kept: "server" });
  await kv.put("hubs", viewer, incoming);
  return Response.json({ hub: incoming, kept: "client" });
}
