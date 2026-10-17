"use client";
/* eslint-disable @next/next/no-img-element -- user-supplied avatars are data URLs */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Atom, Briefcase, ChefHat, ChevronDown, ChevronLeft, ChevronRight, Code2, Dumbbell, GraduationCap, HeartPulse, LayoutGrid,
  MessageCircle, Music2, Palette, Plane, Plus, Scale, Search, Star, User, Wallet, X, type LucideIcon,
} from "lucide-react";
import type { PublicUser } from "@/lib/companion/types";
import { AGE_FILTERS, CATEGORY_INFO, CREATOR_FILTERS, DEFAULT_FILTERS, DISCOVER, FAQ, FILTER_TAGS, GENDER_FILTERS, INTRO, SORTS, type HomeCard, type HomeFilters } from "./data";
import { t, type Lang } from "./i18n";
import { SiteHeader } from "./site-header";

// Measured from the source: bg #0f0f0f, surface #1a1a1a, accent #ff2792, muted #858585 / #aeaeae.
const ACCENT = "#ff2792";
const HUES = [330, 200, 280, 20, 160, 250, 50, 310];

function Media({ i, src, className = "", position = "object-top" }: { i: number; src?: string; className?: string; position?: string }) {
  const [failed, setFailed] = useState(false);
  // An image that failed before hydration never fires onError, so also check when it mounts.
  const checkLoaded = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) requestAnimationFrame(() => setFailed(true));
  };
  if (src && !failed) return <img ref={checkLoaded} src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`${className} object-cover ${position}`} />;
  const h = HUES[i % HUES.length];
  return (
    <div
      className={className}
      style={{ background: `linear-gradient(160deg, hsl(${h} 45% 30%), hsl(${(h + 60) % 360} 40% 12%))` }}
    />
  );
}

const glassBtn = "bg-white/10 bg-[linear-gradient(0deg,rgba(0,0,0,0.2),rgba(0,0,0,0.2))]";

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}


function Dropdown({
  label,
  value,
  options,
  onChange,
  lang,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 shrink-0 items-center rounded-full pl-2 pr-0.5 text-[14px] font-medium leading-[22px] ${value !== options[0].value ? "bg-white/20" : "bg-white/10"}`}
      >
        {t(lang, current.label)}
        <span className="grid h-5 w-5 place-items-center"><ChevronDown size={12} className={open ? "rotate-180" : ""} /></span>
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className="absolute left-0 top-10 z-20 min-w-[160px] rounded-[12px] bg-[#1a1a1a] p-1 shadow-xl ring-1 ring-white/10 rtl:left-auto rtl:right-0">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full rounded-[8px] px-3 py-2 text-start text-[14px] hover:bg-white/10 ${o.value === value ? "text-white" : "text-[#aeaeae]"}`}
              >
                {t(lang, o.label)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  All: LayoutGrid,
  Tech: Code2,
  Business: Briefcase,
  Finance: Wallet,
  Health: HeartPulse,
  Fitness: Dumbbell,
  Food: ChefHat,
  Creative: Palette,
  Music: Music2,
  Education: GraduationCap,
  Law: Scale,
  Science: Atom,
  Lifestyle: Plane,
};

function sortCards(cards: HomeCard[], sort: string) {
  const out = [...cards];
  if (sort === "chats") out.sort((a, b) => b.chats - a.chats || b.messages - a.messages);
  else if (sort === "rating") out.sort((a, b) => b.rating - a.rating || b.ratings - a.ratings);
  else if (sort === "new") out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // Trending: activity weighted by rating, so new experts with good ratings still surface.
  else out.sort((a, b) => b.messages + b.rating * b.ratings * 4 - (a.messages + a.rating * a.ratings * 4));
  return out;
}

/** Left sidebar: every category with its experts and what each one specializes in. */
function CategorySidebar({
  cards,
  active,
  onSelect,
  lang,
}: {
  cards: HomeCard[];
  active: string;
  onSelect: (tag: string) => void;
  lang: Lang;
}) {
  const [open, setOpen] = useState<string | null>(active !== "All" ? active : null);
  return (
    <aside className="hidden w-[260px] shrink-0 md:block" aria-label="Categories">
      <div className="sticky top-[68px] max-h-[calc(100vh-84px)] overflow-y-auto rounded-[16px] bg-[#141414] p-2 ring-1 ring-white/5">
        <p className="px-2 pb-2 pt-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#858585]">{t(lang, "Categories")}</p>
        {FILTER_TAGS.map((tag) => {
          const Icon = CATEGORY_ICONS[tag] ?? LayoutGrid;
          const experts = tag === "All" ? cards : cards.filter((c) => c.tags.includes(tag));
          const isActive = active === tag;
          const isOpen = open === tag && tag !== "All";
          return (
            <div key={tag}>
              <div className={`flex items-center rounded-[10px] ${isActive ? "bg-[#ff2792]/15" : "hover:bg-white/5"}`}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(tag);
                    setOpen(tag === "All" ? null : tag);
                  }}
                  aria-pressed={isActive}
                  className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-start"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[8px] ${isActive ? "bg-[#ff2792] text-white" : "bg-white/5 text-[#aeaeae]"}`}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[14px] font-medium ${isActive ? "text-white" : "text-[#e5e5e5]"}`}>{t(lang, tag === "All" ? "All experts" : tag)}</span>
                    {tag !== "All" && <span className="block truncate text-[11px] text-[#757575]">{CATEGORY_INFO[tag]}</span>}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-[#aeaeae]">{experts.length}</span>
                </button>
                {tag !== "All" && experts.length > 0 && (
                  <button type="button" aria-label={`Show ${tag} experts`} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : tag)} className="grid h-8 w-7 place-items-center text-[#858585] hover:text-white">
                    <ChevronDown size={14} className={isOpen ? "rotate-180" : ""} />
                  </button>
                )}
              </div>
              {isOpen && (
                <ul className="mb-1 ms-[22px] border-s border-white/10 py-1 ps-3">
                  {experts.map((c) => (
                    <li key={c.id}>
                      <a href={`/chat/start/${c.id}`} className="flex items-center gap-2 rounded-[8px] px-1.5 py-1.5 hover:bg-white/5">
                        {c.image ? <img src={c.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover object-top" /> : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ff2792] text-[12px] font-semibold">{c.name[0]}</span>}
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{c.name} · <span className="text-[#ff6bb5]">{c.tagline}</span></span>
                          <span className="block truncate text-[11px] text-[#858585]">{c.expertise}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function JoiHome({
  cards,
  user,
  lang,
  initialFilters,
}: {
  cards: HomeCard[];
  user: PublicUser | null;
  lang: Lang;
  initialFilters: HomeFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState(initialFilters);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialFilters.q));
  const [{ slide, tick }, setHero] = useState({ slide: 0, tick: 0 });

  // Side-menu links change the query string; follow them.
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const update = (patch: Partial<HomeFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    const qs = new URLSearchParams();
    (Object.keys(next) as (keyof HomeFilters)[]).forEach((k) => {
      if (next[k] !== DEFAULT_FILTERS[k]) qs.set(k, next[k]);
    });
    router.replace(qs.size ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const visible = useMemo(() => {
    const age = AGE_FILTERS.find((a) => a.value === filters.age) ?? AGE_FILTERS[0];
    const q = filters.q.trim().toLowerCase();
    const list = cards.filter((c) => {
      if (filters.gender !== "any" && c.gender !== filters.gender) return false;
      if (c.age < age.min || c.age > age.max) return false;
      if (filters.creator === "original" && c.creator !== "original") return false;
      if (filters.creator === "community" && c.creator === "original") return false;
      if (filters.creator === "mine" && c.creator !== "mine") return false;
      if (filters.tag !== "All" && !c.tags.includes(filters.tag)) return false;
      if (q && !`${c.name} ${c.tagline} ${c.expertise} ${c.blurb}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return sortCards(list, filters.sort);
  }, [cards, filters]);

  const heroCards = useMemo(() => sortCards(cards, "trending").slice(0, 5), [cards]);
  const slides = Math.max(heroCards.length, 1);
  const hero = heroCards[slide % slides];

  // Hero autoplay: the active dot fills as a progress bar, then advances.
  useEffect(() => {
    const id = setInterval(() => {
      setHero((h) => (h.tick < 100 ? { ...h, tick: h.tick + 1 } : { slide: (h.slide + 1) % slides, tick: 0 }));
    }, 60);
    return () => clearInterval(id);
  }, [slides]);
  const go = (n: number) => setHero({ slide: (n + slides) % slides, tick: 0 });
  const activeLabel = filters.tag === "All" ? t(lang, "All experts") : t(lang, filters.tag);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <SiteHeader user={user} lang={lang} />

      <main className="mx-auto w-full max-w-[1320px] md:px-4">
        {/* hero: featured expert */}
        {hero && (
          <section className="relative h-[200px] overflow-hidden md:rounded-[12px]">
            <Media i={slide} src={hero.image} position="object-[center_25%]" className="absolute inset-y-0 right-0 h-full w-[55%] rtl:left-0 rtl:right-auto" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/85 to-transparent rtl:bg-gradient-to-l" />
            <a href={`/chat/start/${hero.id}`} className="relative flex h-full flex-col items-start justify-center px-4 md:px-8">
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1">
                <i className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                <span className="text-[10px] font-semibold tracking-[0.06em] text-white/70">{t(lang, "ONLINE")} · {t(lang, "Featured expert")}</span>
              </span>
              <h1 className="mt-2.5 text-[30px] font-bold leading-[34px]">{hero.name}</h1>
              <p className="mt-1 text-[16px] font-semibold text-[#ff6bb5]">{hero.tagline}</p>
              <p className="mt-1 max-w-[420px] text-[13px] leading-5 text-[#cfcfcf]">{t(lang, "Expert in")}: {hero.expertise}</p>
              <span className="mt-3 rounded-full px-[22px] py-[9px] text-[13px] font-semibold leading-4" style={{ background: ACCENT }}>
                {t(lang, "Say Hi")}
              </span>
            </a>
            <div className="absolute bottom-4 right-4 flex items-center gap-[30px] md:right-6 rtl:left-4 rtl:right-auto">
              <div className="hidden items-center gap-[5px] md:flex">
                {Array.from({ length: slides }, (_, i) =>
                  i === slide ? (
                    <span key={i} className="h-1.5 w-[90px] overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-white" style={{ width: `${tick}%` }} />
                    </span>
                  ) : (
                    <button key={i} type="button" aria-label={`Slide ${i + 1}`} onClick={() => go(i)} className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  ),
                )}
              </div>
              <div className="flex gap-2.5">
                <button type="button" aria-label="Previous" onClick={() => go(slide - 1)} className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/10 backdrop-blur">
                  <ChevronLeft size={24} />
                </button>
                <button type="button" aria-label="Next" onClick={() => go(slide + 1)} className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/10 backdrop-blur">
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="mt-5 flex gap-5">
          <CategorySidebar cards={cards} active={filters.tag} onSelect={(tag) => update({ tag })} lang={lang} />

          <div className="min-w-0 flex-1">
            {/* mobile categories (sidebar is desktop only) */}
            <div className="flex gap-1.5 overflow-x-auto px-2 pb-2 md:hidden [scrollbar-width:none]">
              {FILTER_TAGS.map((tag) => {
                const Icon = CATEGORY_ICONS[tag] ?? LayoutGrid;
                return (
                  <button key={tag} type="button" aria-pressed={filters.tag === tag} onClick={() => update({ tag })} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ${filters.tag === tag ? "bg-[#ff2792]" : "bg-white/10"}`}>
                    <Icon size={14} />
                    {t(lang, tag === "All" ? "All experts" : tag)}
                  </button>
                );
              })}
            </div>

            {/* toolbar: search + filters */}
            <div className="flex flex-wrap items-center gap-2 px-2 md:px-0">
              {searchOpen ? (
                <div className="flex h-8 items-center gap-1 rounded-full border border-[#303030] bg-white/10 pl-2 pr-1">
                  <Search size={16} />
                  <input
                    autoFocus
                    value={filters.q}
                    onChange={(e) => update({ q: e.target.value })}
                    placeholder={t(lang, "Search characters")}
                    aria-label={t(lang, "Search characters")}
                    className="w-[180px] bg-transparent text-[14px] outline-none"
                  />
                  <button type="button" aria-label="Close search" onClick={() => { update({ q: "" }); setSearchOpen(false); }} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/10">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#303030] bg-white/10">
                  <Search size={16} />
                </button>
              )}
              <Dropdown label="Creator" value={filters.creator} options={CREATOR_FILTERS} onChange={(v) => update({ creator: v })} lang={lang} />
              <Dropdown label="Age" value={filters.age} options={AGE_FILTERS} onChange={(v) => update({ age: v })} lang={lang} />
              <Dropdown label="Gender" value={filters.gender} options={GENDER_FILTERS} onChange={(v) => update({ gender: v })} lang={lang} />
            </div>

            {/* title + sort tabs */}
            <div className="mt-4 flex flex-wrap items-end justify-between gap-2 px-2 md:px-0">
              <div>
                <h2 className="text-[20px] font-bold">{activeLabel}</h2>
                <p className="text-[12px] text-[#858585]">
                  {visible.length} {t(lang, "experts")}{filters.tag !== "All" && CATEGORY_INFO[filters.tag] ? ` · ${CATEGORY_INFO[filters.tag]}` : ""}
                </p>
              </div>
              <div role="tablist" aria-label="Sort" className="flex gap-1 rounded-full bg-white/5 p-1">
                {SORTS.map((so) => (
                  <button key={so.value} type="button" role="tab" aria-selected={filters.sort === so.value} onClick={() => update({ sort: so.value })} className={`rounded-full px-3 py-1 text-[12px] font-medium ${filters.sort === so.value ? "bg-white text-black" : "text-[#aeaeae] hover:text-white"}`}>
                    {t(lang, so.label)}
                  </button>
                ))}
              </div>
            </div>

            {/* expert grid */}
            <section className="grid grid-cols-2 gap-x-2 gap-y-4 px-2 pb-16 pt-3 md:grid-cols-3 md:px-0 xl:grid-cols-4">
              <Link href="/generate/character" className="group flex flex-col overflow-hidden rounded-[14px] bg-gradient-to-br from-[#ff2792]/30 via-[#1a1a1a] to-[#1a1a1a] ring-1 ring-[#ff2792]/30">
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-5 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-[#ff2792] transition group-hover:scale-110"><Plus size={28} /></span>
                  <p className="text-[18px] font-bold leading-6">
                    {t(lang, "Create your own")} {t(lang, "AI Expert")}
                  </p>
                  <p className="text-[12px] text-[#aeaeae]">{t(lang, "Type any field, AI builds the expert")}</p>
                </div>
              </Link>
              {visible.map((c, i) => {
                const Icon = CATEGORY_ICONS[c.tags[0]] ?? LayoutGrid;
                return (
                  <article key={c.id} className="group relative flex flex-col overflow-hidden rounded-[14px] bg-[#1a1a1a] ring-1 ring-white/5 transition hover:ring-[#ff2792]/50">
                    {/* Plain <a>: this route creates a chat, so it must not be prefetched. */}
                    <a href={`/chat/start/${c.id}`} aria-label={`Chat with ${c.name}`} className="absolute inset-0 z-0" />
                    <div className="pointer-events-none relative aspect-[4/5] overflow-hidden">
                      <Media i={i} src={c.image} className="absolute inset-0 h-full w-full transition duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-black/30" />
                      {c.tags[0] && (
                        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold backdrop-blur rtl:left-auto rtl:right-2">
                          <Icon size={12} />
                          {t(lang, c.tags[0])}
                        </span>
                      )}
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold backdrop-blur rtl:left-2 rtl:right-auto">
                        <Star size={11} className="fill-[#fbbf24] text-[#fbbf24]" />
                        {c.ratings ? c.rating.toFixed(1) : t(lang, "New")}
                      </span>
                    </div>
                    <div className="pointer-events-none relative -mt-8 flex flex-1 flex-col gap-1 px-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[16px] font-bold leading-5">{c.name}</p>
                          <p className="truncate text-[13px] font-semibold text-[#ff6bb5]">{c.tagline}</p>
                        </div>
                        <Link
                          href={`/character/${c.id}`}
                          aria-label={`${c.name} profile`}
                          className={`pointer-events-auto relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-white/20 ${glassBtn}`}
                        >
                          <User size={16} />
                        </Link>
                      </div>
                      <p className="line-clamp-2 text-[12px] leading-4 text-[#bdbdbd]">
                        <span className="text-[#858585]">{t(lang, "Expert in")}: </span>
                        {c.expertise}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-[#858585]">
                        <span className="flex items-center gap-1"><MessageCircle size={12} />{compact(c.chats)} {t(lang, "chats")}</span>
                        <span>{c.creator === "original" ? t(lang, "PRO Original") : c.creator === "mine" ? <span className="text-white">{t(lang, "Yours")}</span> : t(lang, "Community")}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
              {visible.length === 0 && (
                <div className="col-span-1 flex flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-white/15 p-6 text-center md:col-span-2">
                  <p className="text-[14px] text-[#aeaeae]">{t(lang, "No characters match these filters.")}</p>
                  <button type="button" onClick={() => { update({ ...DEFAULT_FILTERS }); setSearchOpen(false); }} className="rounded-full bg-white/10 px-4 py-2 text-[14px] font-medium">
                    {t(lang, "Reset filters")}
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* intro + FAQ */}
        <section className="mx-auto flex max-w-[1040px] flex-col gap-10 px-4 pb-20 md:px-0">
          <div className="flex flex-col gap-5">
            <h2 className="text-[16px] font-bold leading-[22px] text-[#f1f1f1]">{INTRO.title}</h2>
            <p className="text-[14px] leading-5 text-[#aeaeae]">{INTRO.text}</p>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-medium leading-[26px] text-[#f1f1f1]">{t(lang, "Frequently Asked Questions")}</h2>
            <div className="flex flex-col gap-3">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-[12px] bg-[#1a1a1a]">
                  <summary className="flex cursor-pointer list-none items-center justify-between p-5 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-[14px] font-medium leading-[22px]">{f.q}</h3>
                    <ChevronRight size={20} className="shrink-0 transition-transform group-open:rotate-90 rtl:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-[14px] leading-5 text-[#aeaeae]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-medium leading-[26px] text-[#f1f1f1]">{t(lang, "Discover more")}</h2>
            <div className="flex flex-wrap gap-2">
              {DISCOVER.map((d) => (
                <Link key={d.label} href={d.href} className="rounded-full border border-white/20 px-3 py-1.5 text-[12px] font-medium hover:bg-white/10">{d.label}</Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
