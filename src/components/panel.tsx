import type { ReactNode } from "react";

/** A titled section of the workspace. Everything on the project page is one of these. */
export function Panel({
  title,
  meta,
  tone,
  children,
}: {
  title: string;
  meta?: ReactNode;
  /** Puts a coloured spine down the left edge. Decoration, not state. */
  tone?: "live" | "done";
  children: ReactNode;
}) {
  const spine =
    tone === "live"
      ? "before:bg-[var(--brand)]"
      : tone === "done"
        ? "before:bg-[var(--done)]"
        : "before:bg-transparent";
  return (
    <section
      className={`border-border bg-card relative flex flex-col overflow-hidden rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-16px_rgba(0,0,0,0.18)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] ${spine}`}
    >
      <header className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b px-5 py-3.5 sm:px-6">
        <h2 className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-tight">
          {title}
        </h2>
        {meta}
      </header>
      <div className="flex flex-col gap-5 p-5 sm:p-6">{children}</div>
    </section>
  );
}

/** A small uppercase label above a block of content. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-muted-foreground flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] uppercase">
        <span aria-hidden className="h-px w-3 shrink-0 bg-[var(--brand)] opacity-70" />
        {label}
      </h3>
      {children}
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
          <span className="text-muted-foreground/50 select-none">&mdash;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Status chip. Neutral by default; "live" for the thing currently in play. */
export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "live" | "done";
}) {
  const tones = {
    neutral: "border-border text-muted-foreground",
    live: "border-[var(--brand)]/45 bg-[var(--brand)]/12 text-[var(--brand-ink)]",
    done: "border-[var(--done)]/40 bg-[var(--done)]/12 text-[var(--done)]",
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${tones[tone]}`}>
      {children}
    </span>
  );
}
