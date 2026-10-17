"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ChatDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const remove = async () => {
    if (!confirm("Delete this chat?")) return;
    const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };
  return (
    <button type="button" aria-label="Delete chat" onClick={remove} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#858585] hover:bg-white/10 hover:text-white">
      <Trash2 size={16} />
    </button>
  );
}
