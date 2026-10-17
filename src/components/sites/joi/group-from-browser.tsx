"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { GroupView } from "./group-view";
import type { HubExpert } from "./hub-view";
import { useT } from "./lang-context";
import { readLocalGroups } from "./local-groups";

type Expert = HubExpert & { modelLabel: string };
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

/** Opens a group from the browser copy when this server instance doesn't have it. */
export function GroupFromBrowser({ groupId, experts }: { groupId: string; experts: Expert[] }) {
  const { tr } = useT();
  const json = useSyncExternalStore(subscribe, () => JSON.stringify(readLocalGroups().find((g) => g.id === groupId) ?? null), () => "loading");
  if (json === "loading") return <main className="grid min-h-screen place-items-center bg-[#0f0f0f] text-[#aeaeae]">…</main>;
  const local = JSON.parse(json) as ReturnType<typeof readLocalGroups>[number] | null;
  if (!local) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0f0f0f] px-4 text-center text-white">
        <div>
          <p className="text-[18px] font-semibold">{tr("Group not found")}</p>
          <Link href="/groups" className="mt-4 inline-block rounded-full bg-[#ff2792] px-5 py-2 text-[14px] font-semibold">{tr("Expert groups")}</Link>
        </div>
      </main>
    );
  }
  const members = local.memberIds.map((id) => experts.find((e) => e.id === id)).filter((m): m is Expert => Boolean(m));
  return <GroupView groupId={local.id} name={local.name} members={members} initialMessages={local.messages} />;
}
