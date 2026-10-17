import { GroupsView } from "@/components/sites/joi/groups-view";
import type { HubExpert } from "@/components/sites/joi/hub-view";
import type { LocalGroup } from "@/components/sites/joi/local-groups";
import { PageShell } from "@/components/sites/joi/page-shell";
import { avatarFor } from "@/lib/companion/avatar";
import { listGroups } from "@/lib/companion/groups";
import { getPageContext } from "@/lib/companion/page-context";
import { listCharacters } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const [{ user, viewerId, lang }, characters] = await Promise.all([getPageContext(), listCharacters()]);
  const experts: HubExpert[] = characters.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline, image: avatarFor(c), tags: c.tags }));
  const serverGroups: LocalGroup[] = (viewerId ? await listGroups(viewerId) : []).map((g) => ({ id: g.id, name: g.name, memberIds: g.memberIds, messages: [], updatedAt: g.updatedAt }));
  return (
    <PageShell user={user} lang={lang}>
      <GroupsView experts={experts} serverGroups={serverGroups} />
    </PageShell>
  );
}
