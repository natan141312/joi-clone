"use client";
/* eslint-disable @next/next/no-img-element -- small static SVG */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Ellipsis, X } from "lucide-react";
import type { PublicUser } from "@/lib/companion/types";
import { LEGAL, NAV, NAV_HREF, SIDE_MENU } from "./data";
import { t, type Lang } from "./i18n";

function SidebarIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21H7c-2.2 0-4-1.8-4-4V7c0-2.2 1.8-4 4-4h10c2.2 0 4 1.8 4 4v10c0 2.2-1.8 4-4 4M9 21V3" />
    </svg>
  );
}

const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "English - EN" },
  { value: "he", label: "עברית - HE" },
];

export function SiteHeader({ user, lang }: { user: PublicUser | null; lang: Lang }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [more, setMore] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close the "more" popover on outside click / Escape.
  useEffect(() => {
    if (!more) return;
    const onDown = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMore(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMore(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [more]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  const setLang = async (l: Lang) => {
    await fetch("/api/lang", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: l }) });
    setMore(false);
    setLangOpen(false);
    router.refresh();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMore(false);
    router.push("/");
    router.refresh();
  };

  const activeNav = NAV.find((n) => (NAV_HREF[n] === "/" ? pathname === "/" : pathname.startsWith(NAV_HREF[n])));

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between bg-[#0f0f0f] px-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenu(true)}
            className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/10 backdrop-blur"
          >
            <SidebarIcon />
          </button>
          <Link href="/" aria-label="Home">
            <img src="/sites/joi/logo.svg" width={54} height={33} alt="" />
          </Link>
        </div>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 gap-2 rounded-full bg-[#0f0f0f] p-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n}
              href={NAV_HREF[n]}
              className={`flex h-[38px] items-center rounded-full px-3.5 text-[14px] font-medium leading-[22px] ${n === activeNav ? "bg-white/12" : "hover:bg-white/5"}`}
            >
              {t(lang, n)}
            </Link>
          ))}
        </nav>
        <div ref={moreRef} className="relative flex items-center gap-2">
          {user ? (
            <Link href="/chats" className="flex h-[38px] items-center gap-2 rounded-full bg-white/10 pl-1 pr-3.5 text-[14px] font-medium">
              <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#ff2792] text-[13px] font-semibold">{user.name[0]?.toUpperCase()}</span>
              <span className="max-w-[120px] truncate">{user.name}</span>
            </Link>
          ) : (
            <Link href="/signup" className="flex h-[38px] items-center rounded-full bg-[#f1f1f1] px-3.5 text-[14px] font-medium leading-[22px] text-black">
              {t(lang, "Sign up")}
            </Link>
          )}
          <button type="button" aria-label="More" aria-expanded={more} onClick={() => setMore((m) => !m)} className="grid h-[38px] w-[38px] place-items-center rounded-full hover:bg-white/10">
            <Ellipsis size={16} />
          </button>
          {more && (
            <div className="absolute right-0 top-[46px] z-40 w-[220px] rounded-[12px] bg-[#0f0f0f]/90 p-1 shadow-xl ring-1 ring-white/10 backdrop-blur-xl rtl:left-0 rtl:right-auto">
              {user ? (
                <>
                  <Link href="/?creator=mine&gender=any" onClick={() => setMore(false)} className="block rounded-[8px] px-3 py-2 text-[14px] hover:bg-white/10">{t(lang, "My characters")}</Link>
                  <button type="button" onClick={logout} className="w-full rounded-[8px] px-3 py-2 text-start text-[14px] hover:bg-white/10">{t(lang, "Log out")}</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMore(false)} className="block rounded-[8px] px-3 py-2 text-[14px] hover:bg-white/10">{t(lang, "Log in")}</Link>
              )}
              <hr className="my-1 border-[#303030]" />
              <button type="button" aria-expanded={langOpen} onClick={() => setLangOpen((o) => !o)} className="flex w-full justify-between rounded-[8px] px-3 py-2 text-start text-[14px] hover:bg-white/10">
                {t(lang, "Language")}
                <span className="text-[#858585]">{LANGS.find((l) => l.value === lang)?.label}</span>
              </button>
              {langOpen &&
                LANGS.map((l) => (
                  <button key={l.value} type="button" onClick={() => setLang(l.value)} className="flex w-full items-center justify-between rounded-[8px] px-5 py-2 text-start text-[13px] text-[#aeaeae] hover:bg-white/10 hover:text-white">
                    {l.label}
                    {l.value === lang && <Check size={14} />}
                  </button>
                ))}
            </div>
          )}
        </div>
      </header>

      {/* side menu (popover in the source) */}
      {menu && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMenu(false)}>
          <aside
            className="absolute inset-y-0 left-0 flex w-[280px] flex-col overflow-y-auto bg-[#121212] p-3 rtl:left-auto rtl:right-0"
            onClick={(e) => e.stopPropagation()}
            aria-label="Main menu"
          >
            <div className="mb-4 flex items-center justify-between">
              <img src="/sites/joi/logo.svg" width={54} height={33} alt="" />
              <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/10">
                <X size={20} />
              </button>
            </div>
            {SIDE_MENU.map((g) => (
              <div key={g.title + g.items[0].label} className="border-b border-[#303030] py-2">
                {g.title && <p className="px-3 py-2 text-[14px] font-semibold">{t(lang, g.title)}</p>}
                {g.items.map((it) => (
                  <Link key={it.label} href={it.href} onClick={() => setMenu(false)} className="block rounded-[8px] px-3 py-2 text-[14px] text-[#aeaeae] hover:bg-white/5 hover:text-white">
                    {t(lang, it.label)}
                  </Link>
                ))}
              </div>
            ))}
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 pt-4 text-[12px] text-[#757575]">
              {LEGAL.map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setMenu(false)} className="hover:text-white">{t(lang, l.label)}</Link>
              ))}
            </div>
            <p className="px-3 pt-4 text-[12px] text-[#757575]">© 2026 JOI AI. All rights reserved.</p>
          </aside>
        </div>
      )}
    </>
  );
}
