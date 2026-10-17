// The life HUB: one personal record the user and every expert share.
// Isomorphic (used by the browser store, the API and the prompt builder).
import { toWidget, type Widget } from "./widgets";

export const LIFE_AREAS = ["health", "fitness", "finance", "career", "learning", "relationships", "home", "fun"] as const;
export type LifeArea = (typeof LIFE_AREAS)[number];

export type HubTask = {
  id: string;
  title: string;
  area: LifeArea;
  done: boolean;
  due?: string;
  /** Expert id that created it, if any. */
  by?: string;
  createdAt: string;
};

export type HubMemory = { id: string; text: string; by?: string; createdAt: string };

/** A widget an expert built in chat and the user pinned to that expert's app page. */
export type HubApp = {
  id: string;
  by: string;
  widget: Widget;
  /** Checked checklist items, or the tracker's current value. */
  checked?: number[];
  current?: number;
  createdAt: string;
};

export type Hub = {
  /** Free text "about me" written by the user. */
  profile: string;
  goals: Partial<Record<LifeArea, string>>;
  tasks: HubTask[];
  memories: HubMemory[];
  apps: HubApp[];
  updatedAt: string;
};

export const EMPTY_HUB: Hub = { profile: "", goals: {}, tasks: [], memories: [], apps: [], updatedAt: "1970-01-01T00:00:00.000Z" };

const LIMITS = { profile: 3000, goal: 300, task: 200, memory: 300, tasks: 300, memories: 200 };

function str(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function area(v: unknown): LifeArea {
  return LIFE_AREAS.includes(v as LifeArea) ? (v as LifeArea) : "home";
}

/** Validates/cleans a hub coming from the browser. */
export function sanitizeHub(input: unknown): Hub {
  const h = (input ?? {}) as Record<string, unknown>;
  const goalsIn = (h.goals ?? {}) as Record<string, unknown>;
  const goals: Hub["goals"] = {};
  for (const a of LIFE_AREAS) {
    const g = str(goalsIn[a], LIMITS.goal);
    if (g) goals[a] = g;
  }
  const tasks = (Array.isArray(h.tasks) ? h.tasks : []).slice(0, LIMITS.tasks).flatMap((t) => {
    const x = (t ?? {}) as Record<string, unknown>;
    const title = str(x.title, LIMITS.task);
    if (!title) return [];
    return [{
      id: str(x.id, 80) || crypto.randomUUID(),
      title,
      area: area(x.area),
      done: x.done === true,
      due: str(x.due, 30) || undefined,
      by: str(x.by, 80) || undefined,
      createdAt: str(x.createdAt, 40) || new Date().toISOString(),
    }];
  });
  const memories = (Array.isArray(h.memories) ? h.memories : []).slice(0, LIMITS.memories).flatMap((m) => {
    const x = (m ?? {}) as Record<string, unknown>;
    const text = str(x.text, LIMITS.memory);
    if (!text) return [];
    return [{ id: str(x.id, 80) || crypto.randomUUID(), text, by: str(x.by, 80) || undefined, createdAt: str(x.createdAt, 40) || new Date().toISOString() }];
  });
  const apps = (Array.isArray(h.apps) ? h.apps : []).slice(0, 100).flatMap((a) => {
    const x = (a ?? {}) as Record<string, unknown>;
    const widget = toWidget(x.widget);
    const by = str(x.by, 80);
    if (!widget || !by) return [];
    const checked = Array.isArray(x.checked) ? x.checked.filter((i): i is number => Number.isInteger(i)).slice(0, 40) : undefined;
    const current = typeof x.current === "number" && Number.isFinite(x.current) ? x.current : undefined;
    return [{ id: str(x.id, 80) || crypto.randomUUID(), by, widget, checked, current, createdAt: str(x.createdAt, 40) || new Date().toISOString() }];
  });
  return { profile: str(h.profile, LIMITS.profile), goals, tasks, memories, apps, updatedAt: str(h.updatedAt, 40) || new Date().toISOString() };
}

/** Compact text the experts read before answering. */
export function hubContext(hub: Hub | null | undefined): string {
  if (!hub) return "";
  const parts: string[] = [];
  if (hub.profile) parts.push(`About the user (written by them):\n${hub.profile}`);
  const goals = LIFE_AREAS.filter((a) => hub.goals[a]).map((a) => `- ${a}: ${hub.goals[a]}`);
  if (goals.length) parts.push(`The user's goals:\n${goals.join("\n")}`);
  const open = hub.tasks.filter((t) => !t.done).slice(0, 25).map((t) => `- [${t.area}] ${t.title}${t.due ? ` (due ${t.due})` : ""}`);
  if (open.length) parts.push(`Open tasks in the user's hub:\n${open.join("\n")}`);
  const mem = hub.memories.slice(-30).map((m) => `- ${m.text}`);
  if (mem.length) parts.push(`Things experts learned about the user:\n${mem.join("\n")}`);
  return parts.join("\n\n").slice(0, 6000);
}

/** Instructions that let an expert act on the hub with inline tags. */
export const HUB_ACTIONS_PROMPT = [
  "You can update the user's life hub by adding lines in exactly this format anywhere in your reply (they are hidden from the user and executed):",
  `[[task: <short task> | <area>]]  (area is one of: ${LIFE_AREAS.join(", ")}; optionally add | due YYYY-MM-DD)`,
  "[[memory: <short fact about the user worth remembering>]]",
  "Only add a task when the user agreed to do something or asked you to track it. Only add a memory for stable, useful facts the user told you (goals, constraints, preferences). Never invent facts.",
].join("\n");

export type HubAction = { type: "task"; title: string; area: LifeArea; due?: string } | { type: "memory"; text: string };

const ACTION_RE = /\[\[\s*(task|memory)\s*:\s*([^\]]+?)\s*\]\]/gi;

/** Pulls [[task: ...]] / [[memory: ...]] tags out of a reply. */
export function parseHubActions(text: string): HubAction[] {
  const out: HubAction[] = [];
  for (const m of text.matchAll(ACTION_RE)) {
    const kind = m[1].toLowerCase();
    const parts = m[2].split("|").map((p) => p.trim());
    if (kind === "memory" && parts[0]) out.push({ type: "memory", text: parts[0].slice(0, LIMITS.memory) });
    if (kind === "task" && parts[0]) {
      const due = parts.find((p) => /^due\s+\d{4}-\d{2}-\d{2}$/i.test(p))?.replace(/^due\s+/i, "");
      out.push({ type: "task", title: parts[0].slice(0, LIMITS.task), area: area(parts[1]?.toLowerCase()), due });
    }
  }
  return out;
}

/** Reply text with action tags removed (what the user sees). */
export function stripHubActions(text: string) {
  return text.replace(ACTION_RE, "").replace(/\[\[[^\]]*$/, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function applyHubActions(hub: Hub, actions: HubAction[], by?: string): Hub {
  if (!actions.length) return hub;
  const now = new Date().toISOString();
  const tasks = [...hub.tasks];
  const memories = [...hub.memories];
  for (const a of actions) {
    if (a.type === "task" && !tasks.some((t) => !t.done && t.title.toLowerCase() === a.title.toLowerCase())) {
      tasks.push({ id: crypto.randomUUID(), title: a.title, area: a.area, done: false, due: a.due, by, createdAt: now });
    }
    if (a.type === "memory" && !memories.some((m) => m.text.toLowerCase() === a.text.toLowerCase())) {
      memories.push({ id: crypto.randomUUID(), text: a.text, by, createdAt: now });
    }
  }
  return { ...hub, tasks: tasks.slice(-LIMITS.tasks), memories: memories.slice(-LIMITS.memories), updatedAt: now };
}

export function pinApp(hub: Hub, by: string, widget: Widget): Hub {
  const now = new Date().toISOString();
  return { ...hub, apps: [...hub.apps, { id: crypto.randomUUID(), by, widget, createdAt: now }].slice(-100), updatedAt: now };
}
