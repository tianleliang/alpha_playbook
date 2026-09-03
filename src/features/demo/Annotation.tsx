import type { ReactNode } from "react";

/**
 * A note about what you are looking at.
 *
 * The demo is silent otherwise - a reviewer sees output without knowing what
 * produced it, what the system decided on its own, or what a real user would
 * do next. These say that, next to the thing they are about.
 *
 * Inline rather than floating callouts with arrows, because those fall apart
 * on a phone and this needs to survive being opened on one.
 */
export function Annotation({
  label = "What you are seeing",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <aside className="border-l-2 border-amber-500/60 bg-amber-500/[0.05] py-3 pr-4 pl-4">
      <p className="mb-1 font-mono text-[10px] tracking-[0.14em] text-amber-700 uppercase dark:text-amber-500">
        {label}
      </p>
      <div className="text-[13.5px] leading-relaxed [&_p+p]:mt-2">{children}</div>
    </aside>
  );
}

/**
 * A note attached to a control that does nothing here. Says what it would do,
 * so a dead button reads as "saved run" rather than "broken".
 */
export function InertNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground mt-2 text-xs leading-relaxed italic">
      In the live app: {children}
    </p>
  );
}
