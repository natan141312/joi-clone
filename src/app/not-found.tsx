import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0f0f0f] px-4 text-center text-white">
      <div>
        <p className="text-[64px] font-bold leading-none text-[#ff2792]">404</p>
        <h1 className="mt-3 text-[22px] font-semibold">This page could not be found</h1>
        <p className="mt-2 text-[14px] text-[#aeaeae]">The chat or page may have expired. Pick a character to start a new chat.</p>
        <Link href="/?gender=any" className="mt-6 inline-block rounded-full bg-[#ff2792] px-6 py-2.5 text-[14px] font-semibold">Back to Explore</Link>
      </div>
    </main>
  );
}
