/* eslint-disable @next/next/no-img-element -- avatars are data URLs */
import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterActions } from "@/components/sites/joi/character-actions";
import { PageShell } from "@/components/sites/joi/page-shell";
import { avatarFor } from "@/lib/companion/avatar";
import { getPageContext } from "@/lib/companion/page-context";
import { characterStats, getCharacter } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [character, ctx, stats] = await Promise.all([getCharacter(id), getPageContext(), characterStats()]);
  if (!character) notFound();
  const isOwner = Boolean(character.ownerId && character.ownerId === ctx.viewerId);
  const s = stats[id] ?? { chats: 0, messages: 0 };
  const rows: [string, string][] = [
    ["Appearance", character.appearance],
    ["Personality", character.traits],
    ["About", character.description],
    ["Scenario", character.scenario],
    ["Greeting", character.greeting],
  ];

  return (
    <PageShell user={ctx.user} lang={ctx.lang}>
      <main className="mx-auto grid max-w-[960px] gap-8 px-4 py-8 md:grid-cols-[300px_1fr]">
        <div className="aspect-[229/318] overflow-hidden rounded-[12px] bg-gradient-to-b from-[#5a2342] to-[#1a1a1a]">
          <img src={avatarFor(character)} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[13px] text-[#aeaeae]">{character.tagline}</p>
            <h1 className="text-[32px] font-bold leading-tight">{character.name}, {character.age}</h1>
            <p className="mt-1 text-[13px] text-[#858585]">
              {character.ownerId ? (isOwner ? "Created by you" : "Community character") : "PRO Original"} · {s.chats} chats · {s.messages} messages
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[character.style === "anime" ? "Anime style" : "Realistic", ...character.tags].map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[12px]">{tag}</span>
              ))}
            </div>
          </div>
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <section key={k}>
              <h2 className="text-[14px] font-semibold">{k}</h2>
              <p className="whitespace-pre-wrap text-[14px] leading-5 text-[#aeaeae]">{v.replaceAll("{{char}}", character.name).replaceAll("{{user}}", "you")}</p>
            </section>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <a href={`/chat/start/${character.id}`} className="rounded-full bg-[#ff2792] px-6 py-2.5 text-[14px] font-semibold">Ask {character.name}</a>
            {isOwner && <Link href={`/character/${character.id}/edit`} className="rounded-full bg-white/10 px-6 py-2.5 text-[14px] font-medium">Edit</Link>}
            {isOwner && <CharacterActions id={character.id} />}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
