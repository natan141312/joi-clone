/* eslint-disable @next/next/no-img-element -- chat images are data URLs */
import Link from "next/link";
import { PageShell } from "@/components/sites/joi/page-shell";
import { getPageContext } from "@/lib/companion/page-context";
import { getCharacter, listChats } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

// Every picture from the viewer's chats: ones they sent and ones characters generated.
export default async function GalleryPage() {
  const { user, viewerId, lang } = await getPageContext();
  const chats = viewerId ? await listChats(viewerId) : [];
  const items = (
    await Promise.all(
      chats.map(async (chat) => {
        const character = await getCharacter(chat.characterId);
        return chat.messages
          .filter((m) => m.image)
          .map((m) => ({ id: m.id, image: m.image as string, chatId: chat.id, from: m.role === "user" ? "You" : character?.name ?? "Character", at: m.createdAt }));
      }),
    )
  )
    .flat()
    .sort((a, b) => b.at.localeCompare(a.at));
  const imagesEnabled = Boolean(process.env.SD_BASE_URL);

  return (
    <PageShell user={user} lang={lang}>
      <main className="mx-auto max-w-[1170px] px-4 py-8">
        <h1 className="text-[28px] font-bold">Gallery</h1>
        <p className="mb-6 mt-1 text-[14px] text-[#aeaeae]">
          Pictures from your chats.{" "}
          {imagesEnabled
            ? "Open a chat and press the sparkle button to ask a character for a picture."
            : "Image generation is off: set SD_BASE_URL to let characters send pictures. Pictures you attach still appear here."}
        </p>
        {items.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-white/15 p-10 text-center text-[#aeaeae]">
            No pictures yet. <Link href="/" className="text-white underline">Start a chat</Link>.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {items.map((it) => (
              <Link key={it.id} href={`/chat/${it.chatId}`} className="group relative overflow-hidden rounded-[12px] bg-[#1a1a1a]">
                <img src={it.image} alt="" className="aspect-[3/4] w-full object-cover transition group-hover:scale-105" />
                <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[12px]">{it.from}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </PageShell>
  );
}
