/* eslint-disable @next/next/no-img-element -- avatars are data URLs */
import Link from "next/link";
import { ChatDeleteButton } from "@/components/sites/joi/chat-delete-button";
import { PageShell } from "@/components/sites/joi/page-shell";
import { getPageContext } from "@/lib/companion/page-context";
import { getCharacter, listChats } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const { user, viewerId, lang } = await getPageContext();
  const chats = viewerId ? await listChats(viewerId) : [];
  const rows = await Promise.all(chats.map(async (c) => ({ chat: c, character: await getCharacter(c.characterId) })));
  return (
    <PageShell user={user} lang={lang}>
      <main className="mx-auto max-w-[760px] px-4 py-8">
        <h1 className="mb-4 text-[28px] font-bold">Chats</h1>
        {!user && <p className="mb-4 rounded-[12px] bg-white/5 p-3 text-[13px] text-[#aeaeae]">Chats are saved in this browser. <Link href="/signup" className="text-white underline">Sign up</Link> to keep them in your account.</p>}
        {rows.length === 0 && <p className="text-[#aeaeae]">No chats yet. <Link href="/" className="text-white underline">Pick a character</Link>.</p>}
        <ul className="flex flex-col gap-2">
          {rows.map(({ chat, character }) => {
            const last = chat.messages.at(-1);
            return (
              <li key={chat.id} className="flex items-center gap-3 rounded-[12px] bg-[#1a1a1a] p-3 hover:bg-white/10">
                {character?.avatar ? <img src={character.avatar} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ff2792] font-semibold">{character?.name[0] ?? "?"}</span>}
                <Link href={`/chat/${chat.id}`} className="min-w-0 flex-1">
                  <p className="font-medium">{character?.name ?? "Deleted character"}</p>
                  <p className="truncate text-[13px] text-[#858585]">{last ? last.content || "[picture]" : ""}</p>
                </Link>
                <span className="hidden text-[12px] text-[#757575] sm:block">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                <ChatDeleteButton id={chat.id} />
              </li>
            );
          })}
        </ul>
      </main>
    </PageShell>
  );
}
