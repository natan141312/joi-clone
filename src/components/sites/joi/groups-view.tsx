"use client";
/* eslint-disable @next/next/no-img-element -- expert portraits */

import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Check, Plus, Trash2, Users } from "lucide-react";
import type { HubExpert } from "./hub-view";
import { useT } from "./lang-context";
import { readLocalGroups, removeLocalGroup, saveLocalGroup, type LocalGroup } from "./local-groups";

const PRESETS: { name: string; ids: string[] }[] = [
  { name: "Money & Home", ids: ["lara", "lior", "david"] },
  { name: "Health Team", ids: ["leah", "kai", "sofia", "marco"] },
  { name: "Startup Board", ids: ["noa", "maya", "yuki", "david"] },
  { name: "Creative Studio", ids: ["selene", "alex", "elena"] },
];

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

export function GroupsView({ experts, serverGroups }: { experts: HubExpert[]; serverGroups: LocalGroup[] }) {
  const router = useRouter();
  const { tr } = useT();
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [removed, setRemoved] = useState<string[]>([]);
  const localJson = useSyncExternalStore(subscribe, () => JSON.stringify(readLocalGroups()), () => "[]");
  const byId = new Map(experts.map((e) => [e.id, e]));

  const groups = useMemo(() => {
    const map = new Map(serverGroups.map((g) => [g.id, g]));
    for (const g of JSON.parse(localJson) as LocalGroup[]) {
      const s = map.get(g.id);
      if (!s || g.updatedAt > s.updatedAt) map.set(g.id, g);
    }
    return [...map.values()].filter((g) => !removed.includes(g.id)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [serverGroups, localJson, removed]);

  const create = async (ids: string[], groupName: string) => {
    if (ids.length < 2) return setError(tr("Pick at least 2 experts"));
    setBusy(true);
    setError(undefined);
    const res = await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: groupName, memberIds: ids }) }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError(tr("Could not create the group"));
    const g = (await res.json()) as LocalGroup;
    saveLocalGroup({ id: g.id, name: g.name, memberIds: g.memberIds, messages: [], updatedAt: g.updatedAt });
    router.push(`/groups/${g.id}`);
  };

  const remove = async (id: string) => {
    if (!confirm(tr("Delete this group?"))) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" }).catch(() => null);
    removeLocalGroup(id);
    setRemoved((r) => [...r, id]);
  };

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 6 ? p : [...p, id]));

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="flex items-center gap-2 text-[28px] font-bold"><Users size={26} className="text-[#ff6bb5]" />{tr("Expert groups")}</h1>
        <p className="text-[14px] text-[#aeaeae]">{tr("Put several experts in one room. They answer together, see each other's replies and can discuss until they agree.")}</p>
      </header>

      {groups.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[16px] font-semibold">{tr("My groups")}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-[14px] bg-[#1a1a1a] p-3 hover:bg-white/10">
                <a href={`/groups/${g.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex -space-x-2 rtl:space-x-reverse">
                    {g.memberIds.slice(0, 4).map((id) => byId.get(id)?.image ? <img key={id} src={byId.get(id)!.image} alt="" className="h-9 w-9 rounded-full object-cover object-top ring-2 ring-[#1a1a1a]" /> : <span key={id} className="h-9 w-9 rounded-full bg-[#ff2792] ring-2 ring-[#1a1a1a]" />)}
                  </div>
                  <span className="min-w-0">
                    <span dir="auto" className="block truncate font-medium">{g.name}</span>
                    <span className="block truncate text-[12px] text-[#858585]">{g.memberIds.map((id) => byId.get(id)?.name).filter(Boolean).join(" · ")}</span>
                  </span>
                </a>
                <button type="button" aria-label={tr("Delete")} onClick={() => remove(g.id)} className="grid h-8 w-8 place-items-center rounded-full text-[#858585] hover:bg-white/10"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-[16px] font-semibold">{tr("Ready-made groups")}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => (
            <button key={p.name} type="button" disabled={busy} onClick={() => create(p.ids.filter((id) => byId.has(id)), tr(p.name))} className="flex flex-col items-start gap-2 rounded-[14px] bg-gradient-to-br from-[#ff2792]/15 to-[#1a1a1a] p-3 text-start ring-1 ring-white/10 hover:ring-[#ff2792]/50">
              <span className="font-semibold">{tr(p.name)}</span>
              <span className="text-[12px] text-[#aeaeae]">{p.ids.map((id) => byId.get(id)?.name).filter(Boolean).join(", ")}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[16px] bg-[#141414] p-4 ring-1 ring-white/10">
        <h2 className="text-[16px] font-semibold">{tr("Build your own group")} <span className="text-[12px] font-normal text-[#858585]">({picked.length}/6)</span></h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {experts.map((e) => {
            const on = picked.includes(e.id);
            return (
              <button key={e.id} type="button" aria-pressed={on} onClick={() => toggle(e.id)} className={`relative flex flex-col items-center gap-1 rounded-[12px] p-2 text-center ${on ? "bg-[#ff2792]/20 ring-1 ring-[#ff2792]" : "bg-white/5 hover:bg-white/10"}`}>
                {e.image ? <img src={e.image} alt="" className="h-14 w-14 rounded-full object-cover object-top" /> : <span className="h-14 w-14 rounded-full bg-[#ff2792]" />}
                <span className="text-[13px] font-medium">{e.name}</span>
                <span className="line-clamp-1 text-[11px] text-[#aeaeae]">{e.tagline}</span>
                {on && <Check size={16} className="absolute end-2 top-2 text-[#ff6bb5]" />}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <input dir="auto" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Group name (optional)")} className="min-w-[200px] flex-1 rounded-[10px] border border-[#303030] bg-white/5 px-3 py-2 text-[14px] outline-none focus:border-white/40" />
          <button type="button" disabled={busy || picked.length < 2} onClick={() => create(picked, name)} className="flex items-center gap-1.5 rounded-full bg-[#ff2792] px-5 py-2 text-[14px] font-semibold disabled:opacity-40">
            <Plus size={16} />
            {tr("Create group")}
          </button>
        </div>
        {error && <p className="text-[13px] text-[#ff6b86]">{error}</p>}
      </section>
    </main>
  );
}
