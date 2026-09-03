import Link from "next/link";
import type { ReactNode } from "react";

import { Mark } from "@/components/Mark";
import { ThemeToggle } from "@/features/workspace/ThemeToggle";

/**
 * The band across the top of every page.
 *
 * Chrome, deliberately: it holds the mark, the name and the theme switch, and
 * nothing that belongs to a particular screen. Having one everywhere is most
 * of what stops the app reading as a series of unrelated documents.
 */
export function SiteHeader({ right, href = "/" }: { right?: ReactNode; href?: string }) {
  return (
    <header className="border-border bg-card/60 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-4 px-6 py-3">
        <Link href={href} className="group flex items-center gap-2.5">
          <Mark />
          <span className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-tight">
            Playbook
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
