"use client";
/* eslint-disable @next/next/no-img-element -- expert portraits */

import Link from "next/link";
import { useState } from "react";
import { Brain, CheckCircle2, Circle, LayoutGrid, Plus, Target, Trash2, UserRound, Users } from "lucide-react";
import { LIFE_AREAS, type LifeArea } from "@/lib/companion/hub";
import { AppWidget } from "./app-widget";
import { useT } from "./lang-context";
import { useHub } from "./use-hub";

export type HubExpert = { id: string; name: string; tagline: string; image?: string; tags: string[] };

// Which expert categories serve each life area.
const AREA_TAGS: Record<LifeArea, string[]> = {
  health: ["Health"],
  fitness: ["Fitness", "Health"],
  finance: ["Finance"],
  career: ["Business", "Tech", "Law"],
  learning: ["Education", "Science", "Tech"],
  relationships: ["Health", "Lifestyle"],
  home: ["Food", "Lifestyle"],
  fun: ["Music", "Creative", "Lifestyle"],
};

const card = "rounded-[16px] bg-[#141414] p-4 ring-1 ring-white/10";
const input = "w-full rounded-[10px] border border-[#303030] bg-white/5 px-3 py-2 text-[14px] text-white outline-none focus:border-white/40";

export function HubView({ experts, userName }: { experts: HubExpert[]; userName: string }) {
  const { hub, update } = useHub();
  const { tr } = useT();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskArea, setTaskArea] = useState<LifeArea>("health");
  const [profileDraft, setProfileDraft] = useState<string | null>(null);
  const expertById = new Map(experts.map((e) => [e.id, e]));
  const open = hub.tasks.filter((t) => !t.done);
  const done = hub.tasks.filter((t) => t.done);

  const addTask = () => {
    const title = taskTitle.trim();
    if (!title) return;
    update((h) => ({ ...h, tasks: [...h.tasks, { id: crypto.randomUUID(), title, area: taskArea, done: false, createdAt: new Date().toISOString() }] }));
    setTaskTitle("");
  };

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold">{tr("Life Hub")}</h1>
          <p className="text-[14px] text-[#aeaeae]">
            {tr("Hi")} {userName} · {open.length} {tr("open tasks")} · {hub.memories.length} {tr("memories")} · {hub.apps.length} {tr("apps")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/groups" className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[14px] font-medium hover:bg-white/20">
            <Users size={16} />
            {tr("Expert groups")}
          </Link>
          <Link href="/generate/character" className="flex items-center gap-1.5 rounded-full bg-[#ff2792] px-4 py-2 text-[14px] font-semibold">
            <Plus size={16} />
            {tr("Create an expert")}
          </Link>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* About me */}
        <section className={card}>
          <h2 className="mb-1 flex items-center gap-2 text-[16px] font-semibold"><UserRound size={18} className="text-[#ff6bb5]" />{tr("About me")}</h2>
          <p className="mb-2 text-[12px] text-[#858585]">{tr("Every expert reads this before answering. Write your situation, preferences and constraints.")}</p>
          <textarea
            dir="auto"
            rows={6}
            className={input}
            placeholder={tr("e.g. 29, software developer in Tel Aviv, run 3x a week, saving for an apartment, vegetarian…")}
            value={profileDraft ?? hub.profile}
            onChange={(e) => setProfileDraft(e.target.value)}
          />
          <button
            type="button"
            disabled={profileDraft === null}
            onClick={() => {
              update((h) => ({ ...h, profile: (profileDraft ?? "").slice(0, 3000) }));
              setProfileDraft(null);
            }}
            className="mt-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-black disabled:opacity-40"
          >
            {tr("Save")}
          </button>
        </section>

        {/* Tasks */}
        <section className={card}>
          <h2 className="mb-2 flex items-center gap-2 text-[16px] font-semibold"><CheckCircle2 size={18} className="text-[#ff6bb5]" />{tr("Tasks")}</h2>
          <div className="mb-3 flex gap-2">
            <input dir="auto" className={input} placeholder={tr("New task")} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
            <select aria-label={tr("Life area")} className={`${input} w-[130px]`} value={taskArea} onChange={(e) => setTaskArea(e.target.value as LifeArea)}>
              {LIFE_AREAS.map((a) => <option key={a} value={a}>{tr(`area.${a}`)}</option>)}
            </select>
            <button type="button" onClick={addTask} aria-label={tr("Add task")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ff2792]"><Plus size={18} /></button>
          </div>
          {open.length === 0 && <p className="text-[13px] text-[#858585]">{tr("No open tasks. Experts add tasks here when you agree on a step.")}</p>}
          <ul className="flex max-h-[300px] flex-col gap-1 overflow-y-auto">
            {[...open, ...done].map((t) => (
              <li key={t.id} className="group flex items-center gap-2 rounded-[8px] px-1 py-1.5 hover:bg-white/5">
                <button type="button" aria-label={t.done ? tr("Mark as not done") : tr("Mark as done")} onClick={() => update((h) => ({ ...h, tasks: h.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) }))}>
                  {t.done ? <CheckCircle2 size={18} className="text-[#4ade80]" /> : <Circle size={18} className="text-[#858585]" />}
                </button>
                <span dir="auto" className={`flex-1 text-[14px] ${t.done ? "text-[#757575] line-through" : ""}`}>{t.title}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-[#aeaeae]">{tr(`area.${t.area}`)}</span>
                {t.by && expertById.get(t.by) && <span className="hidden text-[11px] text-[#ff6bb5] sm:inline">{expertById.get(t.by)!.name}</span>}
                <button type="button" aria-label={tr("Delete")} onClick={() => update((h) => ({ ...h, tasks: h.tasks.filter((x) => x.id !== t.id) }))} className="opacity-0 group-hover:opacity-100">
                  <Trash2 size={15} className="text-[#858585]" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Life areas: goal + experts */}
      <section className={card}>
        <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold"><Target size={18} className="text-[#ff6bb5]" />{tr("Life areas")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LIFE_AREAS.map((a) => {
            const team = experts.filter((e) => e.tags.some((tg) => AREA_TAGS[a].includes(tg))).slice(0, 4);
            const openInArea = open.filter((t) => t.area === a).length;
            return (
              <div key={a} className="flex flex-col gap-2 rounded-[12px] bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold">{tr(`area.${a}`)}</h3>
                  {openInArea > 0 && <span className="rounded-full bg-[#ff2792]/20 px-2 text-[11px] text-[#ff9ccc]">{openInArea}</span>}
                </div>
                <input
                  dir="auto"
                  className={`${input} py-1.5 text-[13px]`}
                  placeholder={tr("My goal…")}
                  defaultValue={hub.goals[a] ?? ""}
                  key={`${a}-${hub.goals[a] ?? ""}`}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (hub.goals[a] ?? "")) update((h) => ({ ...h, goals: { ...h.goals, [a]: v } }));
                  }}
                />
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {team.map((e) => (
                    <a key={e.id} href={`/chat/start/${e.id}`} title={`${e.name} · ${e.tagline}`}>
                      {e.image ? <img src={e.image} alt={e.name} className="h-8 w-8 rounded-full object-cover object-top ring-2 ring-[#141414]" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ff2792] text-[12px] ring-2 ring-[#141414]">{e.name[0]}</span>}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Apps */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold"><LayoutGrid size={18} className="text-[#ff6bb5]" />{tr("My apps")}</h2>
        {hub.apps.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-white/15 p-4 text-[13px] text-[#aeaeae]">{tr("Ask any expert for a plan, budget, checklist or chart and pin it here.")}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {hub.apps.map((app) => (
              <div key={app.id} className="flex flex-col gap-1">
                <p className="text-[11px] text-[#858585]">{expertById.get(app.by)?.name ?? ""}</p>
                <AppWidget widget={app.widget} by={app.by} app={app} compact />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Memory */}
      <section className={card}>
        <h2 className="mb-1 flex items-center gap-2 text-[16px] font-semibold"><Brain size={18} className="text-[#ff6bb5]" />{tr("Memory")}</h2>
        <p className="mb-2 text-[12px] text-[#858585]">{tr("Facts experts saved about you. Delete anything that is wrong.")}</p>
        {hub.memories.length === 0 ? (
          <p className="text-[13px] text-[#858585]">{tr("Nothing yet.")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {hub.memories.map((m) => (
              <li key={m.id} dir="auto" className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[13px]">
                {m.text}
                {m.by && expertById.get(m.by) && <span className="text-[11px] text-[#ff6bb5]">· {expertById.get(m.by)!.name}</span>}
                <button type="button" aria-label={tr("Delete")} onClick={() => update((h) => ({ ...h, memories: h.memories.filter((x) => x.id !== m.id) }))}>
                  <Trash2 size={13} className="text-[#858585]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
