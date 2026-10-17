import Link from "next/link";
import { getCharacter, listChats } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const chats = await listChats();
  const rows = await Promise.all(chats.map(async (c) => ({ chat: c, character: await getCharacter(c.characterId) })));
  return (
    <main className="mx-auto min-h-screen max-w-[760px] bg-[#0f0f0f] px-4 py-8 text-white">
      <h1 className="mb-4 text-[28px] font-bold">Chats</h1>
      {rows.length === 0 && <p className="text-[#aeaeae]">No chats yet. <Link href="/" className="underline">Pick a character</Link>.</p>}
      <ul className="flex flex-col gap-2">
        {rows.map(({ chat, character }) => (
          <li key={chat.id}>
            <Link href={`/chat/${chat.id}`} className="block rounded-[12px] bg-[#1a1a1a] p-4 hover:bg-white/10">
              <p className="font-medium">{character?.name ?? "Deleted character"}</p>
              <p className="truncate text-[13px] text-[#858585]">{chat.messages.at(-1)?.content || "[picture]"}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
