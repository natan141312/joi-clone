"use client";
/* eslint-disable @next/next/no-img-element -- expert portraits */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, ChevronLeft, Download, ListChecks, MessagesSquare, Send, Square } from "lucide-react";
import { parseHubActions, stripHubActions, type HubAction } from "@/lib/companion/hub";
import type { GroupMessage } from "@/lib/companion/types";
import { splitReply } from "@/lib/companion/widgets";
import { AppWidget } from "./app-widget";
import type { HubExpert } from "./hub-view";
import { useT } from "./lang-context";
import { readLocalGroups, saveLocalGroup } from "./local-groups";
import { MARKDOWN } from "./markdown";
import { applyActionsToHub, readHub } from "./use-hub";

type Member = HubExpert & { modelLabel: string };

function Content({ content, by }: { content: string; by: string }) {
  const parts = splitReply(stripHubActions(content));
  if (!parts.length) return <>…</>;
  return (
    <div className="flex flex-col gap-2">
      {parts.map((p, i) => (p.kind === "text" ? <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{p.text}</ReactMarkdown> : <AppWidget key={i} widget={p.widget} by={by} compact />))}
    </div>
  );
}

export function GroupView({ groupId, name, members, initialMessages }: { groupId: string; name: string; members: Member[]; initialMessages: GroupMessage[] }) {
  const { tr } = useT();
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [actions, setActions] = useState<Record<string, HubAction[]>>({});
  const [error, setError] = useState<string>();
  const abort = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const byId = new Map(members.map((m) => [m.id, m]));
  const memberIds = members.map((m) => m.id);

  // Restore the browser copy when the server copy is shorter (Vercel without a database).
  useEffect(() => {
    const local = readLocalGroups().find((g) => g.id === groupId);
    if (local && local.messages.length > initialMessages.length) setMessages(local.messages);
  }, [groupId, initialMessages.length]);

  useEffect(() => {
    if (messages.length) saveLocalGroup({ id: groupId, name, memberIds, messages, updatedAt: new Date().toISOString() });
    bottom.current?.scrollIntoView({ behavior: "smooth" });
    // memberIds is derived from props and stable for the page's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, groupId, name]);

  const run = async (mode: "answer" | "discuss") => {
    const content = text.trim();
    if (busy || (mode === "answer" && !content)) return;
    setBusy(true);
    setError(undefined);
    setText("");
    const now = new Date().toISOString();
    const history = messages.map((m) => ({ role: m.role, characterId: m.characterId, content: m.content }));
    if (content) setMessages((m) => [...m, { id: `u-${now}`, role: "user", content, createdAt: now }]);
    abort.current = new AbortController();
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abort.current.signal,
        body: JSON.stringify({ text: content, mode, rounds: 2, hub: readHub(), name, memberIds, history }),
      });
      if (!res.ok || !res.body) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `Error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let currentId = "";
      let currentBy = "";
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as { type: string; characterId?: string; text?: string };
          if (ev.type === "start" && ev.characterId) {
            currentBy = ev.characterId;
            currentId = `a-${Date.now()}-${ev.characterId}`;
            reply = "";
            setSpeaking(ev.characterId);
            setMessages((m) => [...m, { id: currentId, role: "assistant", characterId: currentBy, content: "", createdAt: new Date().toISOString() }]);
          } else if (ev.type === "delta" && ev.text) {
            reply += ev.text;
            const id = currentId;
            const r = reply;
            setMessages((m) => m.map((x) => (x.id === id ? { ...x, content: r } : x)));
          } else if (ev.type === "end") {
            const acts = parseHubActions(reply);
            if (acts.length) {
              applyActionsToHub(acts, currentBy);
              const id = currentId;
              setActions((a) => ({ ...a, [id]: acts }));
            }
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
      setSpeaking(null);
    }
  };

  const exportMd = () => {
    const md = messages
      .filter((m) => m.content)
      .map((m) => `**${m.role === "user" ? "You" : byId.get(m.characterId ?? "")?.name ?? "Expert"}:**\n\n${stripHubActions(m.content)}`)
      .join("\n\n---\n\n");
    const url = URL.createObjectURL(new Blob([`# ${name}\n\n${md}\n`], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `group-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-dvh flex-col bg-[#0f0f0f] text-white">
      <header className="flex h-[64px] shrink-0 items-center gap-3 border-b border-[#303030] px-3">
        <Link href="/groups" aria-label={tr("Back")} className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/10"><ChevronLeft size={20} className="rtl:rotate-180" /></Link>
        <div className="flex -space-x-2 rtl:space-x-reverse">
          {members.slice(0, 5).map((m) => (m.image ? <img key={m.id} src={m.image} alt={m.name} className={`h-9 w-9 rounded-full object-cover object-top ring-2 ${speaking === m.id ? "ring-[#ff2792]" : "ring-[#0f0f0f]"}`} /> : <span key={m.id} className="h-9 w-9 rounded-full bg-[#ff2792]" />))}
        </div>
        <div className="min-w-0 flex-1">
          <p dir="auto" className="truncate text-[16px] font-medium">{name}</p>
          <p className="truncate text-[11px] text-[#858585]">
            {speaking ? `${byId.get(speaking)?.name} ${tr("is typing…")}` : members.map((m) => `${m.name} (${m.modelLabel})`).join(" · ")}
          </p>
        </div>
        <button type="button" aria-label={tr("Export chat")} title={tr("Export chat")} onClick={exportMd} className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/10 hover:bg-white/20"><Download size={17} /></button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-[820px] flex-col gap-3">
          {messages.length === 0 && (
            <div className="rounded-[14px] bg-white/5 p-4 text-[14px] text-[#cfcfcf]">
              <p className="font-semibold">{tr("Your expert team is ready.")}</p>
              <p className="mt-1 text-[13px] text-[#aeaeae]">{tr("Ask one question and every expert answers from their field. Press Discuss to let them debate and agree on a plan.")}</p>
            </div>
          )}
          {messages.map((m) => {
            const who = m.characterId ? byId.get(m.characterId) : undefined;
            return m.role === "user" ? (
              <p key={m.id} dir="auto" className="msg-bubble max-w-[80%] self-end whitespace-pre-wrap rounded-[18px] bg-[#ff2792] px-4 py-2 text-[14px] leading-5">{m.content}</p>
            ) : (
              <div key={m.id} className="flex max-w-[90%] gap-2 self-start">
                {who?.image ? <img src={who.image} alt="" className="mt-1 h-8 w-8 shrink-0 rounded-full object-cover object-top" /> : <span className="mt-1 h-8 w-8 shrink-0 rounded-full bg-[#ff2792]" />}
                <div className="min-w-0">
                  <p className="mb-0.5 text-[12px]"><span className="font-semibold">{who?.name}</span> <span className="text-[#ff6bb5]">{who?.tagline}</span></p>
                  <div dir="auto" className={`msg-bubble rounded-[18px] bg-[#1a1a1a] px-4 py-2 text-[14px] leading-6 ${MARKDOWN}`}>
                    {m.content ? <Content content={m.content} by={m.characterId ?? ""} /> : "…"}
                    {actions[m.id]?.map((a, i) => (
                      <p key={i} className="mt-2 flex items-center gap-1.5 rounded-[10px] bg-[#ff2792]/10 px-2 py-1 text-[12px] text-[#ff9ccc]">
                        {a.type === "task" ? <ListChecks size={13} /> : <Brain size={13} />}
                        {a.type === "task" ? `${tr("Added task to your hub")}: ${a.title}` : `${tr("Saved to your memory")}: ${a.text}`}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottom} />
        </div>
      </div>

      {error && <p className="mx-auto mb-2 max-w-[820px] rounded-[12px] bg-[#e1002d]/15 px-3 py-2 text-[13px] text-[#ff6b86]">{error}</p>}

      <form onSubmit={(e) => { e.preventDefault(); run("answer"); }} className="mx-auto mb-3 flex w-full max-w-[820px] items-end gap-2 px-3">
        <input dir="auto" value={text} onChange={(e) => setText(e.target.value)} placeholder={tr("Ask the group…")} aria-label={tr("Message")} className="h-11 flex-1 rounded-[22px] bg-[#1a1a1a] px-4 text-[14px] outline-none" />
        <button type="button" disabled={busy || messages.length === 0} onClick={() => run("discuss")} title={tr("Let the experts discuss together")} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-4 text-[13px] font-medium disabled:opacity-40">
          <MessagesSquare size={16} />
          {tr("Discuss")}
        </button>
        {busy ? (
          <button type="button" aria-label={tr("Stop")} onClick={() => abort.current?.abort()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e1002d]"><Square size={16} /></button>
        ) : (
          <button disabled={!text.trim()} aria-label={tr("Send")} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ff2792] disabled:opacity-40"><Send size={18} className="rtl:rotate-180" /></button>
        )}
      </form>
    </div>
  );
}
