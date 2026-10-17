"use client";
/* eslint-disable @next/next/no-img-element -- user-supplied avatars are data URLs */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Search, User, X } from "lucide-react";
import type { PublicUser } from "@/lib/companion/types";
import { AGE_FILTERS, CREATOR_FILTERS, DEFAULT_FILTERS, DISCOVER, FAQ, FILTER_TAGS, GENDER_FILTERS, INTRO, type HomeCard, type HomeFilters } from "./data";
import { t, type Lang } from "./i18n";
import { SiteHeader } from "./site-header";

// Measured from the source: bg #0f0f0f, surface #1a1a1a, accent #ff2792, muted #858585 / #aeaeae.
const ACCENT = "#ff2792";
const HUES = [330, 200, 280, 20, 160, 250, 50, 310];

function Media({ i, src, className = "" }: { i: number; src?: string; className?: string }) {
  if (src) return <img src={src} alt="" loading="lazy" className={`${className} object-cover object-top`} />;
  const h = HUES[i % HUES.length];
  return (
    <div
      className={className}
      style={{ background: `linear-gradient(160deg, hsl(${h} 45% 30%), hsl(${(h + 60) % 360} 40% 12%))` }}
    />
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function ChatsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
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
    return cards.filter((c) => {
      if (filters.gender !== "any" && c.gender !== filters.gender) return false;
      if (c.age < age.min || c.age > age.max) return false;
      if (filters.creator === "original" && c.creator !== "original") return false;
      if (filters.creator === "community" && c.creator === "original") return false;
      if (filters.creator === "mine" && c.creator !== "mine") return false;
      if (filters.tag !== "All" && !c.tags.includes(filters.tag) && !(filters.tag === "Anime" && c.style === "anime")) return false;
      if (q && !`${c.name} ${c.tagline} ${c.blurb}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cards, filters]);

  const heroCards = cards.slice(0, 5);
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

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <SiteHeader user={user} lang={lang} />

      <main className="mx-auto w-full max-w-[1170px]">
        {/* hero: 1170x190 desktop, full-bleed on mobile */}
        {hero && (
          <section className="relative h-[190px] overflow-hidden md:rounded-[8px]">
            <Media i={slide} src={hero.image} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent rtl:bg-gradient-to-l" />
            <a href={`/chat/start/${hero.id}`} className="relative flex h-full flex-col items-start px-4 pt-[19px] md:px-5">
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1">
                <i className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                <span className="text-[10px] font-semibold tracking-[0.06em] text-white/70">{t(lang, "ONLINE")}</span>
              </span>
              <h1 className="mt-2.5 text-[32px] font-bold leading-[34px]">{hero.name}</h1>
              <p className="mt-2 max-w-[60%] text-[16px] leading-5">{hero.tagline}</p>
              <span className="mt-4 rounded-full px-[22px] py-[10px] text-[13px] font-semibold leading-4" style={{ background: ACCENT }}>
                {t(lang, "Say Hi")}
              </span>
            </a>
            <div className="absolute bottom-5 right-4 flex items-center gap-[30px] md:right-5 rtl:left-4 rtl:right-auto">
              <div className="hidden items-center gap-[5px] md:flex">
                {Array.from({ length: slides }, (_, i) =>
                  i === slide ? (
                    <span key={i} className="h-1.5 w-[90px] overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-white" style={{ width: `${tick}%` }} />
                    </span>
                  ) : (
                    <button key={i} type="button" aria-label={`Slide ${i + 1}`} onClick={() => go(i)} className="h-1.5 w-1.5 rounded-full bg-white/10" />
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

        {/* filters: 32px controls, tags wrap to two rows on mobile */}
        <div className="flex flex-col gap-2 px-2 pb-2 pt-4 md:flex-row md:items-center md:gap-0 md:pt-6">
          <div className="flex flex-wrap items-center gap-2">
            {searchOpen ? (
              <div className="flex h-8 items-center gap-1 rounded-full border border-[#303030] bg-white/10 pl-2 pr-1">
                <Search size={16} />
                <input
                  autoFocus
                  value={filters.q}
                  onChange={(e) => update({ q: e.target.value })}
                  placeholder={t(lang, "Search characters")}
                  aria-label={t(lang, "Search characters")}
                  className="w-[160px] bg-transparent text-[14px] outline-none"
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
          <i className="mx-4 hidden h-6 w-px bg-white/20 md:block" />
          <div className="flex flex-wrap gap-x-1 md:flex-nowrap">
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={filters.tag === tag}
                onClick={() => update({ tag })}
                className={`rounded-full px-2 py-[3px] text-[13px] font-medium leading-5 ${filters.tag === tag ? "bg-white/15 text-white" : "text-white/70 hover:text-white"}`}
              >
                {t(lang, tag)}
              </button>
            ))}
          </div>
        </div>

        {/* grid: 229px columns, 6px column gap, 24px row gap; card = image 318 + info 72 + 28 */}
        <section className="grid grid-cols-2 gap-x-1.5 gap-y-6 px-2 pb-[68px] pt-2 md:grid-cols-5 md:px-0">
          <Link href="/generate/character" className="flex flex-col pb-7">
            <div className="relative aspect-[229/318] overflow-hidden rounded-[12px]">
              <Media i={1} className="absolute inset-0 h-full w-full" />
              <span className="absolute left-0 top-0 px-2 pt-[7px] text-[12px] font-medium leading-5 rtl:left-auto rtl:right-0">{t(lang, "AI Generator")}</span>
              <p className="absolute inset-x-0 bottom-[21px] text-center text-[24px] font-semibold leading-[30px]">
                {t(lang, "Create your own")}
                <br />
                {t(lang, "AI Expert")}
              </p>
            </div>
            <div className="grid h-[72px] place-items-center">
              <span className={`flex h-[38px] items-center gap-1.5 rounded-full px-4 text-[14px] font-medium ${glassBtn}`}>
                <Plus size={20} />
                {t(lang, "Create")}
              </span>
            </div>
          </Link>
          {visible.map((c, i) => (
            <article key={c.id} className="relative flex flex-col rounded-[12px] bg-[#1a1a1a]">
              {/* Plain <a>: this route creates a chat, so it must not be prefetched. */}
              <a href={`/chat/start/${c.id}`} aria-label={`Chat with ${c.name}`} className="absolute inset-0 z-0 rounded-[12px]" />
              <div className="pointer-events-none relative aspect-[229/318] overflow-hidden rounded-[12px]">
                <Media i={i} src={c.image} className="absolute inset-0 h-full w-full" />
                <span className="absolute left-0 top-0 px-2 pt-[7px] text-[12px] font-medium leading-5 [text-shadow:0_1px_2px_rgba(0,0,0,.5)] rtl:left-auto rtl:right-0">{c.tagline}</span>
                <span className="absolute bottom-2 right-[7px] flex items-center gap-1 text-[14px] font-medium leading-[22px] [text-shadow:0_1px_2px_rgba(0,0,0,.5)] rtl:left-[7px] rtl:right-auto">
                  <span className="flex items-center gap-1" title="Chats">{compact(c.chats)}<HeartIcon /></span>
                  <span className="flex items-center gap-1" title="Messages">{compact(c.messages)}<ChatsIcon /></span>
                </span>
              </div>
              <div className="pointer-events-none grid h-[72px] grid-cols-[1fr_32px] gap-x-2 gap-y-0.5 py-2 pl-3 pr-2">
                <p className="truncate text-[16px] font-medium leading-[22px]">{c.name}, {c.age}</p>
                <Link
                  href={`/character/${c.id}`}
                  aria-label={`${c.name} profile`}
                  className={`pointer-events-auto relative z-10 row-span-2 grid h-8 w-8 place-items-center rounded-full hover:bg-white/20 ${glassBtn}`}
                >
                  <User size={20} />
                </Link>
                <p className="line-clamp-2 text-[10px] font-medium leading-4 text-[#858585]">{c.blurb}</p>
              </div>
              <p className="pointer-events-none h-7 px-3 text-[12px] font-medium leading-4 text-[#858585]">
                {c.creator === "original" ? t(lang, "PRO Original") : c.creator === "mine" ? <span className="text-white">{t(lang, "Yours")}</span> : t(lang, "Community")}
              </p>
            </article>
          ))}
          {visible.length === 0 && (
            <div className="col-span-1 flex flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-white/15 p-6 text-center md:col-span-4">
              <p className="text-[14px] text-[#aeaeae]">{t(lang, "No characters match these filters.")}</p>
              <button type="button" onClick={() => { update({ ...DEFAULT_FILTERS, gender: "any" }); setSearchOpen(false); }} className="rounded-full bg-white/10 px-4 py-2 text-[14px] font-medium">
                {t(lang, "Reset filters")}
              </button>
            </div>
          )}
        </section>

        {/* intro + FAQ: 1040px column, 40px between blocks */}
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
