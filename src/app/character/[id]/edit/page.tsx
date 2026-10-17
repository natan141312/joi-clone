import { notFound } from "next/navigation";
import { CharacterForm } from "@/components/sites/joi/character-form";
import { PageShell } from "@/components/sites/joi/page-shell";
import { getPageContext } from "@/lib/companion/page-context";
import { getCharacter } from "@/lib/companion/store";

export default async function EditCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [character, ctx] = await Promise.all([getCharacter(id), getPageContext()]);
  if (!character || !character.ownerId || character.ownerId !== ctx.viewerId) notFound();
  return (
    <PageShell user={ctx.user} lang={ctx.lang}>
      <CharacterForm initial={character} />
    </PageShell>
  );
}
