"use client";

import { createContext, useContext } from "react";
import { t, type Lang } from "./i18n";

const LangContext = createContext<Lang>("he");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** Current UI language plus a translate function for client components. */
export function useT() {
  const lang = useContext(LangContext);
  return { lang, tr: (s: string) => t(lang, s) };
}
