import { cookies } from "next/headers";
import { LANG_COOKIE, parseLang } from "@/components/sites/joi/i18n";

// POST { lang: "en" | "he" } -> remembers the UI language.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { lang?: string };
  const lang = parseLang(body.lang);
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", sameSite: "lax", maxAge: 31536000 });
  return Response.json({ lang });
}
