import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";

import { Backdrop, Footer } from "@/components/Backdrop";
import { SiteHeader } from "@/components/SiteHeader";

/** Headlines only. It carries the personality; nothing else needs to. */
const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/** Ids, dates, counts. Anything where alignment carries meaning. */
const mono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Playbook",
  description: "Turn one goal into a plan built on what you already have.",
};

/**
 * Sets the theme class before the browser paints, so a dark-mode visitor never
 * sees a white flash. It has to be inline and blocking for that to work.
 */
const THEME_SCRIPT = `
try {
  var stored = localStorage.getItem("playbook:theme");
  var dark = stored ? stored === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (dark) document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />

        {/* Decoration only. Remove this line and the app is flat again. */}
        <Backdrop />

        {/* The line, at the top of everything. */}
        <div aria-hidden className="rule-brand h-[3px] w-full shrink-0" />
        <SiteHeader />

        {children}
        <Footer />
      </body>
    </html>
  );
}
