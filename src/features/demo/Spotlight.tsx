import type { ReactNode } from "react";

/**
 * A ring around something real, with a line out to a note.
 *
 * The demo used to explain itself in paragraphs, which turned every stage into
 * something to read. This points instead: here is the actual control, and here
 * is what it does. Fewer words, attached to the thing they are about.
 *
 * On a wide screen the note sits in a gutter beside the highlight, joined by a
 * dashed line. Below that it stacks underneath with a short vertical line, so
 * the connection survives on a phone rather than becoming a floating box.
 */
export function Spotlight({
  note,
  label,
  side = "right",
  children,
}: {
  /** Short. One or two sentences. This is a label, not a paragraph. */
  note: ReactNode;
  /** Optional eyebrow above the note. */
  label?: string;
  side?: "right" | "below";
  children: ReactNode;
}) {
  if (side === "below") {
    return (
      <div className="flex flex-col">
        <Ringed>{children}</Ringed>
        <span aria-hidden className="ml-8 h-5 w-px border-l border-dashed border-amber-500/70" />
        <Note label={label}>{note}</Note>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_15rem] xl:items-center xl:gap-0">
      <Ringed>{children}</Ringed>

      {/* connector: vertical on narrow screens, horizontal in the gutter */}
      <span
        aria-hidden
        className="ml-8 h-5 w-px border-l border-dashed border-amber-500/70 xl:mx-0 xl:h-px xl:w-8 xl:border-t xl:border-l-0"
      />

      <Note label={label}>{note}</Note>
    </div>
  );
}

function Ringed({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl p-1 ring-2 ring-amber-500/70 ring-offset-0">
      <div className="rounded-lg">{children}</div>
    </div>
  );
}

function Note({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <aside className="rounded-lg border border-amber-500/40 bg-amber-500/[0.07] px-3.5 py-3">
      {label && (
        <p className="mb-1 font-mono text-[10px] tracking-[0.12em] text-amber-700 uppercase dark:text-amber-500">
          {label}
        </p>
      )}
      <div className="text-[13px] leading-relaxed">{children}</div>
    </aside>
  );
}

/** A short note with no highlight, for framing a whole stage in one line. */
export function StageNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground border-l-2 border-amber-500/60 py-1 pl-3 text-sm leading-relaxed">
      {children}
    </p>
  );
}
