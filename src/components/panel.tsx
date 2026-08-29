import type { ReactNode } from "react";

/** A titled section of the workspace. Everything on the project page is one of these. */
export function Panel({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-border bg-card flex flex-col gap-5 rounded-xl border p-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {meta}
      </header>
      {children}
    </section>
  );
}

/** A small uppercase label above a block of content. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
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
    live: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    done: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${tones[tone]}`}>
      {children}
    </span>
  );
}
