import type { PublicUser } from "@/lib/companion/types";
import type { Lang } from "./i18n";
import { SiteHeader } from "./site-header";

/** Header + dark page body used by every secondary page. */
export function PageShell({ user, lang, children }: { user: PublicUser | null; lang: Lang; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <SiteHeader user={user} lang={lang} />
      {children}
    </div>
  );
}
