import { JoiHome } from "@/components/sites/joi/joi-home";
import { DEFAULT_FILTERS, type HomeCard, type HomeFilters } from "@/components/sites/joi/data";
import { avatarFor } from "@/lib/companion/avatar";
import { getPageContext } from "@/lib/companion/page-context";
import { characterStats, listCharacters } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [sp, { user, viewerId, lang }, characters, stats] = await Promise.all([searchParams, getPageContext(), listCharacters(), characterStats()]);
  const pick = (k: keyof HomeFilters) => (typeof sp[k] === "string" ? (sp[k] as string) : DEFAULT_FILTERS[k]);
  const initialFilters: HomeFilters = { q: pick("q"), creator: pick("creator"), age: pick("age"), gender: pick("gender"), tag: pick("tag"), sort: pick("sort") };

  const cards: HomeCard[] = characters.map((c) => ({
    id: c.id,
    tagline: c.tagline,
    expertise: c.expertise,
    rating: stats[c.id]?.rating ?? 0,
    ratings: stats[c.id]?.ratings ?? 0,
    createdAt: c.createdAt,
    name: c.name,
    age: c.age,
    gender: c.gender,
    blurb: c.description,
    tags: c.tags,
    style: c.style,
    creator: !c.ownerId ? "original" : c.ownerId === viewerId ? "mine" : "community",
    chats: stats[c.id]?.chats ?? 0,
    messages: stats[c.id]?.messages ?? 0,
    image: avatarFor(c),
  }));
  return <JoiHome cards={cards} user={user} lang={lang} initialFilters={initialFilters} />;
}
