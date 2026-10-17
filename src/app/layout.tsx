import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { LANG_COOKIE, parseLang } from "@/components/sites/joi/i18n";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRO — Chat with AI experts",
  description: "Create an AI expert in any field and chat with them.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = parseLang((await cookies()).get(LANG_COOKIE)?.value);
  return (
    <html
      lang={lang}
      dir={lang === "he" ? "rtl" : "ltr"}
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f0f0f]">{children}</body>
    </html>
  );
}
