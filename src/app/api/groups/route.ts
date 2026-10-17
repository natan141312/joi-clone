import { randomUUID } from "node:crypto";
import { ensureViewerId, getViewerId } from "@/lib/companion/auth";
import { listGroups, MAX_MEMBERS, membersOf, newGroup, saveGroup } from "@/lib/companion/groups";

export async function GET() {
  const viewer = await getViewerId();
  return Response.json(viewer ? await listGroups(viewer) : []);
}

// POST { name?, memberIds: string[] } -> new group
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; memberIds?: unknown };
  const members = await membersOf(body.memberIds);
  if (members.length < 2) return Response.json({ errors: [`Pick 2-${MAX_MEMBERS} experts`] }, { status: 400 });
  const group = newGroup(randomUUID(), await ensureViewerId(), body.name ?? "", members);
  await saveGroup(group);
  return Response.json(group, { status: 201 });
}
