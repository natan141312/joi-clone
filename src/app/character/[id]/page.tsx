/* eslint-disable @next/next/no-img-element -- avatars are data URLs */
import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterActions } from "@/components/sites/joi/character-actions";
import { ExpertApps } from "@/components/sites/joi/expert-apps";
import { t } from "@/components/sites/joi/i18n";
import { ExpertProfile } from "@/components/sites/joi/expert-profile";
import { RateExpert } from "@/components/sites/joi/rate-expert";
import { PageShell } from "@/components/sites/joi/page-shell";
import { avatarFor } from "@/lib/companion/avatar";
import { activeProvider, runningModelLabel } from "@/lib/companion/llm";
import { modelInfo } from "@/lib/companion/models";
import { getPageContext } from "@/lib/companion/page-context";
import { characterStats, getCharacter, getViewerRating } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [character, ctx, stats] = await Promise.all([getCharacter(id), getPageContext(), characterStats()]);
  if (!character) notFound();
  const isOwner = Boolean(character.ownerId && character.ownerId === ctx.viewerId);
  const s = stats[id] ?? { chats: 0, messages: 0, rating: 0, ratings: 0 };
  const myRating = ctx.viewerId ? await getViewerRating(id, ctx.viewerId) : 0;
  const rows: [string, string][] = [
    [t(ctx.lang, "Background"), character.description],
    [t(ctx.lang, "Personality & teaching style"), character.traits],
  ];

  return (
    <PageShell user={ctx.user} lang={ctx.lang}>
      <main className="mx-auto grid max-w-[960px] gap-8 px-4 py-8 md:grid-cols-[300px_1fr]">
        <div className="aspect-[229/318] overflow-hidden rounded-[12px] bg-gradient-to-b from-[#5a2342] to-[#1a1a1a]">
          <img src={avatarFor(character)} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-[32px] font-bold leading-tight">{character.name}</h1>
            <p className="text-[18px] font-semibold text-[#ff6bb5]">{character.tagline}</p>
            <p className="mt-1 text-[14px] text-[#d4d4d4]"><span className="text-[#858585]">{t(ctx.lang, "Expert in")}: </span>{character.expertise}</p>
            <p className="mt-1 text-[13px] text-[#d4d4d4]">
              <span className="text-[#858585]">{t(ctx.lang, "AI model")}: </span>
              {modelInfo(character.model).label}
              {activeProvider() !== "openrouter" && <span className="text-[#858585]"> · {t(ctx.lang, "now running on")} {runningModelLabel(character.model)}</span>}
            </p>
            <p className="mt-1 text-[13px] text-[#858585]">
              {character.ownerId ? (isOwner ? t(ctx.lang, "Created by you") : t(ctx.lang, "Community")) : t(ctx.lang, "PRO Original")} · {s.chats} {t(ctx.lang, "chats")} · {s.messages} {t(ctx.lang, "messages")} · {t(ctx.lang, "age")} {character.age}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[character.style === "anime" ? "Anime" : "Realistic", ...character.tags].map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[12px]">{t(ctx.lang, tag)}</span>
              ))}
            </div>
          </div>
          <RateExpert id={character.id} initialRating={s.rating} initialCount={s.ratings} initialMine={myRating} />
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <section key={k}>
              <h2 className="text-[14px] font-semibold">{k}</h2>
              <p className="whitespace-pre-wrap text-[14px] leading-5 text-[#aeaeae]">{v.replaceAll("{{char}}", character.name).replaceAll("{{user}}", "you")}</p>
            </section>
          ))}
          <ExpertApps expertId={character.id} expertName={character.name} />
          {character.profileMd && (
            <section className="flex flex-col gap-2">
              <h2 className="text-[14px] font-semibold">{t(ctx.lang, "Expert profile")}</h2>
              <ExpertProfile markdown={character.profileMd} />
            </section>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <a href={`/chat/start/${character.id}`} className="rounded-full bg-[#ff2792] px-6 py-2.5 text-[14px] font-semibold">{t(ctx.lang, "Ask")} {character.name}</a>
            {isOwner && <Link href={`/character/${character.id}/edit`} className="rounded-full bg-white/10 px-6 py-2.5 text-[14px] font-medium">{t(ctx.lang, "Edit")}</Link>}
            {isOwner && <CharacterActions id={character.id} />}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
