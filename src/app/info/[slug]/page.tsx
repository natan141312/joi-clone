import Link from "next/link";
import { notFound } from "next/navigation";
import { INFO_PAGES } from "@/components/sites/joi/info-pages";
import { PageShell } from "@/components/sites/joi/page-shell";
import { getPageContext } from "@/lib/companion/page-context";

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = Object.hasOwn(INFO_PAGES, slug) ? INFO_PAGES[slug] : undefined;
  if (!page) notFound();
  const { user, lang } = await getPageContext();
  return (
    <PageShell user={user} lang={lang}>
      <main className="mx-auto max-w-[760px] px-4 py-10">
        <h1 className="mb-4 text-[28px] font-bold">{page.title}</h1>
        {page.body.map((p) => <p key={p} className="mb-3 text-[15px] leading-6 text-[#aeaeae]">{p}</p>)}
        <Link href="/" className="mt-6 inline-block rounded-full bg-white/10 px-4 py-2 text-[14px]">Back to Explore</Link>
      </main>
    </PageShell>
  );
}
