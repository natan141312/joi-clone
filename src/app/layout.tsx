import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { LANG_COOKIE, parseLang } from "@/components/sites/joi/i18n";
import { LangProvider } from "@/components/sites/joi/lang-context";
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
      <head>
        {/* After a new deploy, a page cached from the old one can point at deleted CSS. Reload once if a stylesheet fails. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='LINK'&&t.rel==='stylesheet'){try{if(sessionStorage.getItem('pro_css_reload'))return;sessionStorage.setItem('pro_css_reload','1')}catch(_){}location.reload()}},true);",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0f0f0f]">
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
