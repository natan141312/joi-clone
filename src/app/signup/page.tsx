import { redirect } from "next/navigation";
import { AuthForm } from "@/components/sites/joi/auth-form";
import { PageShell } from "@/components/sites/joi/page-shell";
import { getPageContext } from "@/lib/companion/page-context";

export default async function Page() {
  const { user, lang } = await getPageContext();
  if (user) redirect("/");
  return (
    <PageShell user={user} lang={lang}>
      <AuthForm mode="signup" />
    </PageShell>
  );
}
