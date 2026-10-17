"use client";

/* eslint-disable @next/next/no-img-element -- small static SVG/user-supplied images */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Ellipsis, Plus, Search, User, Video, X } from "lucide-react";
import { type CharacterCard, DISCOVER, FAQ, FILTER_TAGS, HERO_SLIDES, LEGAL, NAV, SIDE_MENU } from "./data";

// Measured from the source: bg #0f0f0f, surface #1a1a1a, accent #ff2792, muted #858585 / #aeaeae.
const ACCENT = "#ff2792";
const HUES = [330, 200, 280, 20, 160, 250, 50, 310];

function Media({ i, src, className = "" }: { i: number; src?: string; className?: string }) {
  if (src) return <img src={src} alt="" className={`${className} object-cover`} />;
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

function SidebarIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21H7c-2.2 0-4-1.8-4-4V7c0-2.2 1.8-4 4-4h10c2.2 0 4 1.8 4 4v10c0 2.2-1.8 4-4 4M9 21V3" />
    </svg>
  );
}

const NAV_HREF: Record<(typeof NAV)[number], string> = {
  Explore: "/",
  Gallery: "/chats",
  "Create AI": "/generate/character",
  Chats: "/chats",
};

const glassBtn = "bg-white/10 bg-[linear-gradient(0deg,rgba(0,0,0,0.2),rgba(0,0,0,0.2))]";

export type HomeCard = CharacterCard & { id: string };

export function JoiHome({ cards }: { cards: HomeCard[] }) {
  const [verified, setVerified] = useState(false);
  const [menu, setMenu] = useState(false);
  const [more, setMore] = useState(false);
  const [{ slide, tick }, setHero] = useState({ slide: 0, tick: 0 });
  const [tag, setTag] = useState<string>("All");
  const slides = HERO_SLIDES.length;
  const hero = HERO_SLIDES[slide];

  // Hero autoplay: the active dot fills as a progress bar, then advances.
  useEffect(() => {
    if (!verified) return;
    const t = setInterval(() => {
      setHero((h) => (h.tick < 100 ? { ...h, tick: h.tick + 1 } : { slide: (h.slide + 1) % slides, tick: 0 }));
    }, 60);
    return () => clearInterval(t);
  }, [verified, slides]);
  const go = (n: number) => setHero({ slide: (n + slides) % slides, tick: 0 });

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* header: 60px, logo 54x33, centered pill nav */}
      <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between bg-[#0f0f0f] px-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenu(true)}
            className="hidden h-[38px] w-[38px] place-items-center rounded-full bg-white/10 backdrop-blur md:grid"
          >
            <SidebarIcon />
          </button>
          <Link href="/" aria-label="Home">
            <img src="/sites/joi/logo.svg" width={54} height={33} alt="" />
          </Link>
        </div>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 gap-2 rounded-full bg-[#0f0f0f] p-1 md:flex">
          {NAV.map((n, i) => (
            <Link
              key={n}
              href={NAV_HREF[n]}
              className={`flex h-[38px] items-center rounded-full px-3.5 text-[14px] font-medium leading-[22px] ${i === 0 ? "bg-white/12" : "hover:bg-white/5"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
        <div className="relative flex items-center gap-2">
          <button type="button" className="h-[38px] rounded-full bg-[#f1f1f1] px-3.5 text-[14px] font-medium leading-[22px] text-black">
            Sign up
          </button>
          <button type="button" aria-label="More" onClick={() => setMore((m) => !m)} className="grid h-[38px] w-[38px] place-items-center rounded-full">
            <Ellipsis size={16} />
          </button>
          {more && (
            <div className="absolute right-0 top-[46px] w-[220px] rounded-[12px] bg-[#0f0f0f]/70 p-1 backdrop-blur-xl">
              <button type="button" className="w-full rounded-[8px] px-3 py-2 text-left text-[14px] hover:bg-white/10">Log in</button>
              <hr className="my-1 border-[#303030]" />
              <button type="button" className="flex w-full justify-between rounded-[8px] px-3 py-2 text-left text-[14px] hover:bg-white/10">
                Language<span className="text-[#858585]">English - EN</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1170px]">
        {/* hero: 1170x190 desktop, full-bleed on mobile */}
        <section className="relative h-[190px] overflow-hidden md:rounded-[8px]">
          <Media i={slide} src={hero.image} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent" />
          <a href="#" className="relative flex h-full flex-col items-start px-4 pt-[19px] md:px-5">
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1">
              <i className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              <span className="text-[10px] font-semibold tracking-[0.06em] text-white/70">ONLINE</span>
            </span>
            <h1 className="mt-2.5 text-[32px] font-bold leading-[34px]">{hero.name}</h1>
            <p className="mt-2 text-[16px] leading-5">{hero.tagline}</p>
            <span className="mt-4 rounded-full px-[22px] py-[10px] text-[13px] font-semibold leading-4" style={{ background: ACCENT }}>
              Say Hi
            </span>
          </a>
          <div className="absolute bottom-5 right-4 flex items-center gap-[30px] md:right-5">
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

        {/* filters: 32px controls, tags wrap to two rows on mobile */}
        <div className="flex flex-col gap-2 px-2 pb-2 pt-4 md:flex-row md:pt-6 md:items-center md:gap-0">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Search" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#303030] bg-white/10">
              <Search size={16} />
            </button>
            {["Any creator", "Any age", "Female"].map((f) => (
              <button key={f} type="button" className="flex h-8 shrink-0 items-center rounded-full bg-white/10 pl-2 pr-0.5 text-[14px] font-medium leading-[22px]">
                {f}
                <span className="grid h-5 w-5 place-items-center"><ChevronDown size={12} /></span>
              </button>
            ))}
          </div>
          <i className="mx-4 hidden h-6 w-px bg-white/20 md:block" />
          <div className="flex flex-wrap gap-x-1 md:flex-nowrap">
            {FILTER_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={`rounded-full px-2 py-[3px] text-[13px] font-medium leading-5 ${tag === t ? "text-white" : "text-white/90 hover:text-white"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* grid: 229px columns, 6px column gap, 24px row gap; card = image 318 + info 72 + 28 */}
        <section className="grid grid-cols-2 gap-x-1.5 gap-y-6 px-2 pb-[68px] pt-2 md:grid-cols-5 md:px-0">
          <Link href="/generate/character" className="flex flex-col pb-7">
            <div className="relative aspect-[229/318] overflow-hidden rounded-[12px]">
              <Media i={1} className="absolute inset-0 h-full w-full" />
              <span className="absolute left-0 top-0 px-2 pt-[7px] text-[12px] font-medium leading-5">AI Generator</span>
              <p className="absolute inset-x-0 bottom-[21px] text-center text-[24px] font-semibold leading-[30px]">
                Create your own
                <br />
                AI Girlfriend
              </p>
            </div>
            <div className="grid h-[72px] place-items-center">
              <span className={`flex h-[38px] items-center gap-1.5 rounded-full px-4 text-[14px] font-medium ${glassBtn}`}>
                <Plus size={20} />
                Create
              </span>
            </div>
          </Link>
          {cards.map((c, i) => (
            // Plain <a>: this route creates a chat, so it must not be prefetched.
            <a key={c.id} href={`/chat/start/${c.id}`} className="flex flex-col rounded-[12px] bg-[#1a1a1a]">
              <div className="relative aspect-[229/318] overflow-hidden rounded-[12px]">
                <Media i={i} src={c.image} className="absolute inset-0 h-full w-full" />
                <span className="absolute left-0 top-0 px-2 pt-[7px] text-[12px] font-medium leading-5 [text-shadow:0_1px_2px_rgba(0,0,0,.5)]">{c.tagline}</span>
                {c.video && (
                  <span className="absolute bottom-0 left-0 flex h-[45%] w-[55%] items-end bg-gradient-to-tr from-[#e01378] to-transparent p-2">
                    <span className="flex items-center gap-1 text-[16px] font-bold">
                      <Video size={20} fill="currentColor" />
                      Video Calls
                    </span>
                  </span>
                )}
                <span className="absolute bottom-2 right-[7px] flex items-center gap-1 text-[14px] font-medium leading-[22px] [text-shadow:0_1px_2px_rgba(0,0,0,.5)]">
                  <span className="flex items-center gap-1">{c.likes}<HeartIcon /></span>
                  <span className="flex items-center gap-1">{c.chats}<ChatsIcon /></span>
                </span>
              </div>
              <div className="grid h-[72px] grid-cols-[1fr_32px] gap-x-2 gap-y-0.5 py-2 pl-3 pr-2">
                <p className="truncate text-[16px] font-medium leading-[22px]">{c.name}, {c.age}</p>
                <span className={`row-span-2 grid h-8 w-8 place-items-center rounded-full ${glassBtn}`}><User size={20} /></span>
                <p className="line-clamp-2 text-[10px] font-medium leading-4 text-[#858585]">{c.blurb}</p>
              </div>
              <p className="h-7 px-3 text-[12px] font-medium leading-4 text-[#858585]">
                {c.badge === "Verified" ? <span className="text-white">✔ Verified</span> : "Joi Original"}
              </p>
            </a>
          ))}
        </section>

        {/* intro + FAQ: 1040px column, 40px between blocks */}
        <section className="mx-auto flex max-w-[1040px] flex-col gap-10 px-4 pb-20 md:px-0">
          <div className="flex flex-col gap-5">
            <h2 className="text-[16px] font-bold leading-[22px] text-[#f1f1f1]">Placeholder section heading</h2>
            <p className="text-[14px] leading-5 text-[#aeaeae]">
              Placeholder paragraph. The source page has a short introduction block here, followed by a frequently asked questions accordion and a row of discovery tags.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-medium leading-[26px] text-[#f1f1f1]">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-3">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-[12px] bg-[#1a1a1a]">
                  <summary className="flex cursor-pointer list-none items-center justify-between p-5 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-[14px] font-medium leading-[22px]">{f.q}</h3>
                    <ChevronRight size={20} className="shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="px-5 pb-5 text-[14px] leading-5 text-[#aeaeae]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-medium leading-[26px] text-[#f1f1f1]">Discover more</h2>
            <div className="flex flex-wrap gap-2">
              {DISCOVER.map((d) => (
                <a key={d} href="#" className="rounded-full border border-white/20 px-3 py-1.5 text-[12px] font-medium">{d}</a>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* side menu (popover in the source) */}
      {menu && (
        <div className="fixed inset-0 z-40" onClick={() => setMenu(false)}>
          <aside
            className="absolute inset-y-0 left-0 flex w-[280px] flex-col overflow-y-auto bg-[#121212] p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <img src="/sites/joi/logo.svg" width={54} height={33} alt="" />
              <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/10">
                <X size={20} />
              </button>
            </div>
            {SIDE_MENU.map((g) => (
              <div key={g.title + g.items[0]} className="border-b border-[#303030] py-2">
                {g.title && <p className="px-3 py-2 text-[14px] font-semibold">{g.title}</p>}
                {g.items.map((it) => (
                  <a key={it} href="#" className="block rounded-[8px] px-3 py-2 text-[14px] text-[#aeaeae] hover:bg-white/5 hover:text-white">{it}</a>
                ))}
              </div>
            ))}
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 pt-4 text-[12px] text-[#757575]">
              {LEGAL.map((l) => <a key={l} href="#">{l}</a>)}
            </div>
            <p className="px-3 pt-4 text-[12px] text-[#757575]">© 2026 JOI AI. All rights reserved.</p>
          </aside>
        </div>
      )}

      {/* age gate: 448px card, 24px radius, blurred page behind */}
      {!verified && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-[12px]" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <div className="w-[448px] max-w-[calc(100vw-32px)] rounded-[24px] bg-[#1a1a1a] px-14 pb-12 pt-[52px] max-md:px-6">
            <h2 id="gate-title" className="text-center text-[36px] font-semibold leading-[44px]">Mature content</h2>
            <p className="mt-[22px] max-w-[296px] text-[18px] font-medium leading-[26px]">
              This page may contain sensitive or adult content. To continue, confirm you’re over 18 years old, and we’ll update your settings to show mature content. You can hide mature content again at any time in Settings.
            </p>
            <button type="button" onClick={() => setVerified(true)} className="mt-8 h-[44px] w-full rounded-full border-2 border-white text-[15px] font-semibold">
              Yes, I’m over 18
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
