import { randomUUID } from "node:crypto";
import { ensureViewerId, getCurrentUser } from "@/lib/companion/auth";
import { getGroup, groupTurnMessages, membersOf, newGroup, sanitizeHistory, saveGroup } from "@/lib/companion/groups";
import { hubContext, sanitizeHub } from "@/lib/companion/hub";
import { streamChat } from "@/lib/companion/llm";
import type { GroupMessage } from "@/lib/companion/types";

type Body = { text?: string; mode?: string; rounds?: number; hub?: unknown; name?: string; memberIds?: unknown; history?: unknown };

/**
 * POST { text, mode: "answer" | "discuss", rounds } -> NDJSON stream of
 * {type:"start",characterId} / {type:"delta",text} / {type:"end",characterId} / {type:"done"}.
 * Every expert answers in turn, seeing the user and all earlier expert messages.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/groups/[id]/messages">) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const text = (body.text ?? "").trim().slice(0, 4000);
  const mode = body.mode === "discuss" ? "discuss" : "answer";
  const rounds = mode === "discuss" ? Math.min(3, Math.max(1, Number(body.rounds) || 2)) : 1;
  const viewer = await ensureViewerId();

  let group = await getGroup(id);
  if (group && group.ownerId !== viewer) return Response.json({ error: "Not found" }, { status: 404 });
  if (!group) {
    // Not on this server instance: rebuild from the browser copy.
    const members = await membersOf(body.memberIds);
    if (members.length < 2 || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) return Response.json({ error: "Group not found" }, { status: 404 });
    group = newGroup(id, viewer, body.name ?? "", members);
    group.messages = sanitizeHistory(body.history, group.memberIds);
  }
  if (!text && mode === "answer") return Response.json({ error: "Message is empty" }, { status: 400 });

  const members = await membersOf(group.memberIds);
  const user = await getCurrentUser();
  const userName = user?.name ?? "the user";
  const userContext = body.hub ? hubContext(sanitizeHub(body.hub)) : "";
  const history: GroupMessage[] = [...group.messages];
  if (text) history.push({ id: randomUUID(), role: "user", content: text, createdAt: new Date().toISOString() });
  const g = group;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(o)}\n`));
      try {
        for (let r = 0; r < rounds; r++) {
          for (const me of members) {
            if (req.signal.aborted) break;
            send({ type: "start", characterId: me.id });
            let reply = "";
            // The free model sometimes returns an empty reply under load: retry once.
            for (let attempt = 0; attempt < 2 && !reply.trim(); attempt++) {
              try {
                const chunks = await streamChat(groupTurnMessages(me, members, history, userName, userContext, mode), me.params, req.signal, me.model);
                for await (const c of chunks) {
                  reply += c;
                  send({ type: "delta", text: c });
                }
              } catch (e) {
                if (attempt === 1) reply = reply || `(${(e as Error).message})`;
              }
            }
            history.push({ id: randomUUID(), role: "assistant", characterId: me.id, content: reply.trim(), createdAt: new Date().toISOString() });
            send({ type: "end", characterId: me.id });
          }
        }
      } finally {
        await saveGroup({ ...g, messages: history.slice(-200), updatedAt: new Date().toISOString() }).catch(() => {});
        send({ type: "done" });
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
