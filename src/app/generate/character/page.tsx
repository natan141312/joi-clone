import { CharacterForm } from "@/components/sites/joi/character-form";
import { PageShell } from "@/components/sites/joi/page-shell";
import { getPageContext } from "@/lib/companion/page-context";

export default async function CreateCharacterPage() {
  const { user, lang } = await getPageContext();
  return (
    <PageShell user={user} lang={lang}>
      <CharacterForm />
    </PageShell>
  );
}
