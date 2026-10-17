import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/sites/joi/logout-button";
import { PageShell } from "@/components/sites/joi/page-shell";
import { getPageContext } from "@/lib/companion/page-context";
import { listCharacters, listChats } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user, viewerId, lang } = await getPageContext();
  if (!user) redirect("/login");
  const [chars, chats] = await Promise.all([listCharacters(), viewerId ? listChats(viewerId) : []]);
  const mine = chars.filter((c) => c.ownerId === user.id);
  return (
    <PageShell user={user} lang={lang}>
      <main className="mx-auto flex max-w-[640px] flex-col gap-4 px-4 py-10">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-[#ff2792] text-[26px] font-bold">{user.name[0]?.toUpperCase()}</span>
          <div>
            <h1 className="text-[26px] font-bold leading-tight">{user.name}</h1>
            <p className="text-[14px] text-[#aeaeae]">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/?creator=mine" className="rounded-[14px] bg-[#1a1a1a] p-4 hover:bg-white/10">
            <p className="text-[28px] font-bold">{mine.length}</p>
            <p className="text-[13px] text-[#aeaeae]">My experts</p>
          </Link>
          <Link href="/chats" className="rounded-[14px] bg-[#1a1a1a] p-4 hover:bg-white/10">
            <p className="text-[28px] font-bold">{chats.length}</p>
            <p className="text-[13px] text-[#aeaeae]">My chats</p>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/generate/character" className="rounded-full bg-[#ff2792] px-5 py-2.5 text-[14px] font-semibold">Create an expert</Link>
          <LogoutButton />
        </div>
      </main>
    </PageShell>
  );
}
