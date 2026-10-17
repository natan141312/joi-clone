"use client";

import { useState } from "react";
import { Check, ListPlus, Pin, PinOff } from "lucide-react";
import { applyHubActions, pinApp, type HubApp } from "@/lib/companion/hub";
import type { ChartWidget, Widget } from "@/lib/companion/widgets";
import { useT } from "./lang-context";
import { readHub, saveHub } from "./use-hub";

// Dark-surface categorical slots from the validated reference palette (max 4 series per chart).
const SERIES = ["#3987e5", "#d95926", "#199e70", "#c98500"];

function Chart({ w }: { w: ChartWidget }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const H = 220;
  const pad = { l: 44, r: 12, t: 12, b: 28 };
  const all = w.series.flatMap((s) => s.values);
  const max = Math.max(0, ...all);
  const min = Math.min(0, ...all);
  const span = max - min || 1;
  const x0 = pad.l;
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const y = (v: number) => pad.t + plotH - ((v - min) / span) * plotH;
  const step = plotW / w.labels.length;
  const ticks = [min, min + span / 2, max];
  const fmt = (v: number) => `${Math.round(v * 100) / 100}${w.unit ? ` ${w.unit}` : ""}`;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={w.title} onMouseLeave={() => setHover(null)}>
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={x0} x2={W - pad.r} y1={y(tk)} y2={y(tk)} stroke="rgba(255,255,255,0.08)" />
            <text x={x0 - 6} y={y(tk) + 4} textAnchor="end" fontSize="10" fill="#9a9a9a">{Math.round(tk * 10) / 10}</text>
          </g>
        ))}
        {w.labels.map((l, i) => (
          <text key={l + i} x={x0 + step * i + step / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#9a9a9a">{l}</text>
        ))}
        {w.kind === "bar"
          ? w.series.map((s, si) => {
              const bw = Math.max(4, (step * 0.7) / w.series.length - 2);
              return s.values.map((v, i) => {
                const bx = x0 + step * i + step * 0.15 + si * (bw + 2);
                const top = Math.min(y(v), y(0));
                return <rect key={`${si}-${i}`} x={bx} y={top} width={bw} height={Math.max(1, Math.abs(y(0) - y(v)))} rx={3} fill={SERIES[si]} opacity={hover === null || hover === i ? 1 : 0.45} />;
              });
            })
          : w.series.map((s, si) => (
              <g key={si}>
                <polyline fill="none" stroke={SERIES[si]} strokeWidth={2} points={s.values.map((v, i) => `${x0 + step * i + step / 2},${y(v)}`).join(" ")} />
                {s.values.map((v, i) => (
                  <circle key={i} cx={x0 + step * i + step / 2} cy={y(v)} r={hover === i ? 5 : 4} fill={SERIES[si]} stroke="#1a1a1a" strokeWidth={2} />
                ))}
              </g>
            ))}
        {hover !== null && w.kind === "line" && <line x1={x0 + step * hover + step / 2} x2={x0 + step * hover + step / 2} y1={pad.t} y2={pad.t + plotH} stroke="rgba(255,255,255,0.25)" />}
        {/* Hover targets wider than the marks */}
        {w.labels.map((_, i) => (
          <rect key={i} x={x0 + step * i} y={pad.t} width={step} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div className="mt-1 rounded-[8px] bg-black/60 px-2 py-1 text-[12px] text-[#e5e5e5]">
          <b>{w.labels[hover]}</b>
          {w.series.map((s, si) => (
            <span key={si} className="ms-3 inline-flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-full" style={{ background: SERIES[si] }} />
              {s.name}: {fmt(s.values[hover] ?? 0)}
            </span>
          ))}
        </div>
      )}
      {w.series.length > 1 && (
        <figcaption className="mt-1 flex flex-wrap gap-3 text-[12px] text-[#cfcfcf]">
          {w.series.map((s, si) => (
            <span key={si} className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: SERIES[si] }} />
              {s.name}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Renders an expert app (widget). In chat it can be pinned to the expert's app page;
 * pinned apps keep their state (checked items, tracker progress) in the hub.
 */
export function AppWidget({ widget, by, app, compact }: { widget: Widget; by: string; app?: HubApp; compact?: boolean }) {
  const { tr } = useT();
  const [checked, setChecked] = useState<number[]>(app?.checked ?? []);
  const [current, setCurrent] = useState<number>(app?.current ?? (widget.type === "tracker" ? widget.current ?? 0 : 0));
  const [pinned, setPinned] = useState(Boolean(app));
  const [added, setAdded] = useState(false);

  const persist = (patch: Partial<HubApp>) => {
    if (!app) return;
    const hub = readHub();
    saveHub({ ...hub, apps: hub.apps.map((a) => (a.id === app.id ? { ...a, ...patch } : a)) });
  };

  const toggle = (i: number) => {
    const next = checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i];
    setChecked(next);
    persist({ checked: next });
  };

  const pin = () => {
    if (pinned && app) {
      const hub = readHub();
      saveHub({ ...hub, apps: hub.apps.filter((a) => a.id !== app.id) });
      setPinned(false);
      return;
    }
    saveHub(pinApp(readHub(), by, widget));
    setPinned(true);
  };

  const addTasks = () => {
    if (widget.type !== "checklist") return;
    saveHub(applyHubActions(readHub(), widget.items.map((title) => ({ type: "task" as const, title, area: "home" as const })), by));
    setAdded(true);
  };

  return (
    <section className={`rounded-[14px] bg-[#141414] ring-1 ring-white/10 ${compact ? "p-3" : "p-4"}`}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-[14px] font-semibold text-white">{widget.title || tr("App")}</h4>
        <div className="flex gap-1">
          {widget.type === "checklist" && (
            <button type="button" onClick={addTasks} disabled={added} className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] hover:bg-white/20 disabled:opacity-60">
              {added ? <Check size={12} /> : <ListPlus size={12} />}
              {added ? tr("Added to hub") : tr("Add to my tasks")}
            </button>
          )}
          <button type="button" onClick={pin} className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] hover:bg-white/20">
            {pinned ? <PinOff size={12} /> : <Pin size={12} />}
            {pinned ? tr("Unpin") : tr("Pin to app")}
          </button>
        </div>
      </header>

      {widget.type === "checklist" && (
        <ul className="flex flex-col gap-1">
          {widget.items.map((it, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-2 rounded-[8px] px-1 py-1 text-[13px] hover:bg-white/5">
                <input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} className="mt-0.5 accent-[#ff2792]" />
                <span className={checked.includes(i) ? "text-[#858585] line-through" : "text-[#e5e5e5]"}>{it}</span>
              </label>
            </li>
          ))}
          <li className="mt-1 text-[11px] text-[#858585]">{checked.length}/{widget.items.length} {tr("done")}</li>
        </ul>
      )}

      {widget.type === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>{widget.columns.map((c) => <th key={c} className="border border-white/10 bg-white/5 px-2 py-1 text-start font-semibold">{c}</th>)}</tr>
            </thead>
            <tbody>
              {widget.rows.map((r, i) => (
                <tr key={i}>{widget.columns.map((_, j) => <td key={j} className="border border-white/10 px-2 py-1 text-[#d4d4d4]">{r[j] ?? ""}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {widget.type === "chart" && <Chart w={widget} />}

      {widget.type === "plan" && (
        <ol className="relative ms-2 border-s border-white/15 ps-4">
          {widget.steps.map((st, i) => (
            <li key={i} className="mb-3 last:mb-0">
              <span className="absolute -start-[7px] mt-1 h-3 w-3 rounded-full bg-[#ff2792]" />
              {st.when && <p className="text-[11px] font-semibold text-[#ff6bb5]">{st.when}</p>}
              <p className="text-[13px] font-medium text-white">{st.title}</p>
              {st.detail && <p className="text-[12px] text-[#aeaeae]">{st.detail}</p>}
            </li>
          ))}
        </ol>
      )}

      {widget.type === "stats" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {widget.items.map((it, i) => (
            <div key={i} className="rounded-[10px] bg-white/5 p-3">
              <p className="text-[11px] text-[#9a9a9a]">{it.label}</p>
              <p className="text-[20px] font-bold text-white">{it.value}</p>
              {it.note && <p className="text-[11px] text-[#858585]">{it.note}</p>}
            </div>
          ))}
        </div>
      )}

      {widget.type === "tracker" && (
        <div>
          <div className="flex items-end justify-between text-[13px]">
            <span className="text-[24px] font-bold text-white">{current}<span className="text-[13px] font-normal text-[#9a9a9a]"> / {widget.target} {widget.unit}</span></span>
            <span className="text-[#9a9a9a]">{Math.min(100, Math.round((current / widget.target) * 100))}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={widget.target} aria-valuenow={current}>
            <div className="h-full rounded-full bg-[#ff2792]" style={{ width: `${Math.min(100, (current / widget.target) * 100)}%` }} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            {[-1, 1].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  const v = Math.max(0, Math.round((current + d) * 100) / 100);
                  setCurrent(v);
                  persist({ current: v });
                }}
                className="h-8 w-8 rounded-full bg-white/10 text-[16px] hover:bg-white/20"
                aria-label={d > 0 ? "+1" : "-1"}
              >
                {d > 0 ? "+" : "−"}
              </button>
            ))}
            <span className="text-[11px] text-[#858585]">{pinned ? tr("Progress is saved") : tr("Pin to save progress")}</span>
          </div>
        </div>
      )}
    </section>
  );
}
