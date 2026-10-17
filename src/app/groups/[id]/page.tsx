import { GroupView } from "@/components/sites/joi/group-view";
import { GroupFromBrowser } from "@/components/sites/joi/group-from-browser";
import { getViewerId } from "@/lib/companion/auth";
import { avatarFor } from "@/lib/companion/avatar";
import { getGroup } from "@/lib/companion/groups";
import { runningModelLabel } from "@/lib/companion/llm";
import { listCharacters } from "@/lib/companion/store";

export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [group, viewer, characters] = await Promise.all([getGroup(id), getViewerId(), listCharacters()]);
  const all = characters.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline, image: avatarFor(c), tags: c.tags, modelLabel: runningModelLabel(c.model) }));
  if (!group || group.ownerId !== viewer) {
    // Not on this server instance: the browser copy has the members and messages.
    return <GroupFromBrowser groupId={id} experts={all} />;
  }
  const members = group.memberIds.map((mid) => all.find((c) => c.id === mid)).filter((m): m is (typeof all)[number] => Boolean(m));
  return <GroupView groupId={group.id} name={group.name} members={members} initialMessages={group.messages} />;
}
