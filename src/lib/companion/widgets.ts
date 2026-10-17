// Expert "apps": experts can answer with interactive widgets instead of only text.
// A widget is a fenced block in the reply:  ```app\n{ "type": "checklist", ... }\n```
// Isomorphic: parsed in the browser for rendering and in prompts for instructions.

export type ChecklistWidget = { type: "checklist"; title: string; items: string[] };
export type TableWidget = { type: "table"; title: string; columns: string[]; rows: string[][] };
export type ChartWidget = {
  type: "chart";
  title: string;
  kind: "bar" | "line";
  labels: string[];
  series: { name: string; values: number[] }[];
  unit?: string;
};
export type PlanWidget = { type: "plan"; title: string; steps: { title: string; detail?: string; when?: string }[] };
export type StatsWidget = { type: "stats"; title: string; items: { label: string; value: string; note?: string }[] };
export type TrackerWidget = { type: "tracker"; title: string; unit: string; target: number; current?: number };

export type Widget = ChecklistWidget | TableWidget | ChartWidget | PlanWidget | StatsWidget | TrackerWidget;

export const APPS_PROMPT = [
  "You are also an app: when a visual tool helps more than text, add ONE widget block to your reply, in this exact format:",
  "```app",
  '{ "type": "...", ... }',
  "```",
  "Widget types (valid JSON, short strings):",
  '- checklist: { "type": "checklist", "title": "...", "items": ["...", "..."] }',
  '- table: { "type": "table", "title": "...", "columns": ["A","B"], "rows": [["1","2"]] }',
  '- chart: { "type": "chart", "title": "...", "kind": "bar" | "line", "labels": ["Jan","Feb"], "series": [{ "name": "...", "values": [1,2] }], "unit": "₪" } (max 4 series, one unit)',
  '- plan: { "type": "plan", "title": "...", "steps": [{ "title": "...", "detail": "...", "when": "Week 1" }] }',
  '- stats: { "type": "stats", "title": "...", "items": [{ "label": "...", "value": "...", "note": "..." }] }',
  '- tracker: { "type": "tracker", "title": "...", "unit": "km", "target": 42, "current": 5 }',
  "Use widgets for plans, budgets, schedules, comparisons, checklists and progress. Keep a short text explanation too. Write widget text in the user's language.",
].join("\n");

const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "");
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number.isFinite(Number(v)) ? Number(v) : NaN);

/** Validates an untrusted widget object; returns null when it is not usable. */
export function toWidget(input: unknown): Widget | null {
  const w = (input ?? {}) as Record<string, unknown>;
  const title = s(w.title, 120);
  switch (w.type) {
    case "checklist": {
      const items = (Array.isArray(w.items) ? w.items : []).map((i) => s(i)).filter(Boolean).slice(0, 40);
      return items.length ? { type: "checklist", title, items } : null;
    }
    case "table": {
      const columns = (Array.isArray(w.columns) ? w.columns : []).map((c) => s(c, 60)).slice(0, 8);
      const rows = (Array.isArray(w.rows) ? w.rows : [])
        .filter(Array.isArray)
        .slice(0, 50)
        .map((r) => (r as unknown[]).slice(0, columns.length).map((c) => s(c, 120)));
      return columns.length && rows.length ? { type: "table", title, columns, rows } : null;
    }
    case "chart": {
      const labels = (Array.isArray(w.labels) ? w.labels : []).map((l) => s(l, 30)).slice(0, 24);
      const series = (Array.isArray(w.series) ? w.series : []).slice(0, 4).flatMap((x) => {
        const o = (x ?? {}) as Record<string, unknown>;
        const values = (Array.isArray(o.values) ? o.values : []).slice(0, labels.length).map(n);
        return values.length && values.every(Number.isFinite) ? [{ name: s(o.name, 40) || title, values }] : [];
      });
      if (!labels.length || !series.length) return null;
      return { type: "chart", title, kind: w.kind === "line" ? "line" : "bar", labels, series, unit: s(w.unit, 10) || undefined };
    }
    case "plan": {
      const steps = (Array.isArray(w.steps) ? w.steps : []).slice(0, 30).flatMap((x) => {
        const o = (x ?? {}) as Record<string, unknown>;
        const t = s(o.title, 120);
        return t ? [{ title: t, detail: s(o.detail, 300) || undefined, when: s(o.when, 40) || undefined }] : [];
      });
      return steps.length ? { type: "plan", title, steps } : null;
    }
    case "stats": {
      const items = (Array.isArray(w.items) ? w.items : []).slice(0, 8).flatMap((x) => {
        const o = (x ?? {}) as Record<string, unknown>;
        const label = s(o.label, 60);
        const value = s(o.value, 40);
        return label && value ? [{ label, value, note: s(o.note, 80) || undefined }] : [];
      });
      return items.length ? { type: "stats", title, items } : null;
    }
    case "tracker": {
      const target = n(w.target);
      if (!Number.isFinite(target) || target <= 0) return null;
      const current = n(w.current);
      return { type: "tracker", title, unit: s(w.unit, 12), target, current: Number.isFinite(current) ? current : 0 };
    }
    default:
      return null;
  }
}

export type ReplyPart = { kind: "text"; text: string } | { kind: "widget"; widget: Widget; raw: string };

const BLOCK_RE = /```app\s*\n([\s\S]*?)```/g;

/** Splits a reply into text and widget parts. Unfinished blocks (while streaming) stay hidden. */
export function splitReply(text: string): ReplyPart[] {
  const parts: ReplyPart[] = [];
  let last = 0;
  for (const m of text.matchAll(BLOCK_RE)) {
    if (m.index! > last) parts.push({ kind: "text", text: text.slice(last, m.index) });
    let widget: Widget | null = null;
    try {
      widget = toWidget(JSON.parse(m[1]));
    } catch {
      widget = null;
    }
    if (widget) parts.push({ kind: "widget", widget, raw: m[1] });
    last = m.index! + m[0].length;
  }
  let rest = text.slice(last);
  const open = rest.indexOf("```app");
  if (open >= 0) rest = rest.slice(0, open);
  if (rest.trim()) parts.push({ kind: "text", text: rest });
  return parts;
}
