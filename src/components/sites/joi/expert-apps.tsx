"use client";

import { LayoutGrid } from "lucide-react";
import { AppWidget } from "./app-widget";
import { useT } from "./lang-context";
import { useHub } from "./use-hub";

/** The expert's app page: every widget pinned from this expert's chats, plus related hub tasks. */
export function ExpertApps({ expertId, expertName }: { expertId: string; expertName: string }) {
  const { hub } = useHub();
  const { tr } = useT();
  const apps = hub.apps.filter((a) => a.by === expertId);
  const tasks = hub.tasks.filter((t) => t.by === expertId && !t.done);
  return (
    <section id="app" className="flex flex-col gap-3 scroll-mt-20">
      <h2 className="flex items-center gap-2 text-[16px] font-semibold">
        <LayoutGrid size={18} className="text-[#ff6bb5]" />
        {tr("App")} · {expertName}
      </h2>
      {apps.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-white/15 p-4 text-[13px] text-[#aeaeae]">
          {tr("No apps yet. Ask the expert for a plan, budget, checklist or chart, then press Pin to app.")}
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {apps.map((a) => (
            <AppWidget key={a.id} widget={a.widget} by={a.by} app={a} />
          ))}
        </div>
      )}
      {tasks.length > 0 && (
        <div className="rounded-[14px] bg-[#141414] p-4 ring-1 ring-white/10">
          <h3 className="mb-2 text-[14px] font-semibold">{tr("Tasks from this expert")}</h3>
          <ul className="list-disc ps-5 text-[13px] text-[#d4d4d4]">
            {tasks.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
