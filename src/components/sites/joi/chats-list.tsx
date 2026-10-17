"use client";
/* eslint-disable @next/next/no-img-element -- avatars may be data URLs */

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { readLocalChats, removeLocalChat, type LocalChat } from "./local-chats";

/** Server chats merged with the browser's own chat index (newest first). */
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
// Snapshot as a string so React can compare it; parsed in useMemo.
const snapshot = () => JSON.stringify(readLocalChats());
const serverSnapshot = () => "[]";

export function ChatsList({ serverChats }: { serverChats: LocalChat[] }) {
  const localJson = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [removed, setRemoved] = useState<string[]>([]);

  const chats = useMemo(() => {
    const byId = new Map(serverChats.map((c) => [c.id, c]));
    for (const c of JSON.parse(localJson) as LocalChat[]) {
      const s = byId.get(c.id);
      // Prefer whichever copy is newer.
      if (!s || c.updatedAt > s.updatedAt) byId.set(c.id, { ...c, avatar: c.avatar ?? s?.avatar });
    }
    return [...byId.values()].filter((c) => !removed.includes(c.id)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [serverChats, localJson, removed]);

  const remove = async (id: string) => {
    if (!confirm("Delete this chat?")) return;
    await fetch(`/api/chats/${id}`, { method: "DELETE" }).catch(() => null);
    removeLocalChat(id);
    setRemoved((r) => [...r, id]);
  };

  if (chats.length === 0) {
    return (
      <p className="text-[#aeaeae]">
        No chats yet. <Link href="/" className="text-white underline">Pick an expert</Link>.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {chats.map((c) => (
        <li key={c.id} className="flex items-center gap-3 rounded-[12px] bg-[#1a1a1a] p-3 hover:bg-white/10">
          {c.avatar ? (
            <img src={c.avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover object-top" />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ff2792] font-semibold">{c.name[0]}</span>
          )}
          <Link href={`/chat/${c.id}?c=${c.characterId}`} className="min-w-0 flex-1">
            <p className="font-medium">
              {c.name} {c.tagline && <span className="text-[12px] font-normal text-[#ff6bb5]">· {c.tagline}</span>}
            </p>
            <p dir="auto" className="truncate text-[13px] text-[#858585]">{c.last}</p>
          </Link>
          <span className="hidden text-[12px] text-[#757575] sm:block">{new Date(c.updatedAt).toLocaleDateString()}</span>
          <button type="button" aria-label="Delete chat" onClick={() => remove(c.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#858585] hover:bg-white/10 hover:text-white">
            <Trash2 size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}
