import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, parseLang } from "@/components/sites/joi/i18n";
import { getCurrentUser, getViewerId } from "./auth";

/** Shared data for pages that render the site header. */
export async function getPageContext() {
  const [user, viewerId, jar] = await Promise.all([getCurrentUser(), getViewerId(), cookies()]);
  return { user, viewerId, lang: parseLang(jar.get(LANG_COOKIE)?.value) };
}
