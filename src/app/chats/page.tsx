import Link from "next/link";
import { ChatsList } from "@/components/sites/joi/chats-list";
import { PageShell } from "@/components/sites/joi/page-shell";
import { avatarFor } from "@/lib/companion/avatar";
import { getPageContext } from "@/lib/companion/page-context";
import { getCharacter, listChats } from "@/lib/companion/store";
import type { LocalChat } from "@/components/sites/joi/local-chats";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const { user, viewerId, lang } = await getPageContext();
  const chats = viewerId ? await listChats(viewerId) : [];
  const serverChats: LocalChat[] = (
    await Promise.all(
      chats.map(async (c) => {
        const character = await getCharacter(c.characterId);
        const last = c.messages.at(-1);
        return {
          id: c.id,
          characterId: c.characterId,
          name: character?.name ?? "Deleted expert",
          tagline: character?.tagline ?? "",
          avatar: character ? avatarFor(character) : undefined,
          last: last ? last.content || "[picture]" : "",
          updatedAt: c.updatedAt,
          hasUserMessage: c.messages.some((m) => m.role === "user"),
        };
      }),
    )
  )
    .filter((c) => c.hasUserMessage)
    .map((c) => ({ id: c.id, characterId: c.characterId, name: c.name, tagline: c.tagline, avatar: c.avatar, last: c.last, updatedAt: c.updatedAt }));

  return (
    <PageShell user={user} lang={lang}>
      <main className="mx-auto max-w-[760px] px-4 py-8">
        <h1 className="mb-4 text-[28px] font-bold">Chats</h1>
        {!user && (
          <p className="mb-4 rounded-[12px] bg-white/5 p-3 text-[13px] text-[#aeaeae]">
            Chats are saved in this browser. <Link href="/signup" className="text-white underline">Sign up</Link> to keep them in your account.
          </p>
        )}
        <ChatsList serverChats={serverChats} />
      </main>
    </PageShell>
  );
}
