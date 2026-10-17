import { HubView, type HubExpert } from "@/components/sites/joi/hub-view";
import { PageShell } from "@/components/sites/joi/page-shell";
import { avatarFor } from "@/lib/companion/avatar";
import { getPageContext } from "@/lib/companion/page-context";
import { listCharacters } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  const [{ user, lang }, characters] = await Promise.all([getPageContext(), listCharacters()]);
  const experts: HubExpert[] = characters.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline, image: avatarFor(c), tags: c.tags }));
  return (
    <PageShell user={user} lang={lang}>
      <HubView experts={experts} userName={user?.name ?? (lang === "he" ? "שם" : "there")} />
    </PageShell>
  );
}
