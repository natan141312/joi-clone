"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "./lang-context";

export function CharacterActions({ id }: { id: string }) {
  const router = useRouter();
  const { tr } = useT();
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!confirm(tr("Delete this expert? Existing chats will stop working."))) return;
    setBusy(true);
    const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.push("/?creator=mine&gender=any");
      router.refresh();
    }
  };
  return (
    <button type="button" disabled={busy} onClick={remove} className="rounded-full bg-[#e1002d]/20 px-6 py-2.5 text-[14px] font-medium text-[#ff6b86] disabled:opacity-50">
      {tr("Delete")}
    </button>
  );
}
