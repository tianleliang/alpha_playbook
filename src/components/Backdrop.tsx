/**
 * The paper the app sits on.
 *
 * Three layers, all decoration, all behind everything and all inert. Deleting
 * the one <Backdrop /> in the layout removes every bit of it and leaves a flat
 * ground - nothing else depends on it.
 *
 *   1. a warm wash falling from the top, so the page has a light source
 *   2. a hairline grid, faded out toward the bottom, for a drafting-paper feel
 *   3. a whisper of grain, which is what stops large flat areas looking digital
 */

const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E";

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* light source */}
      <div
        className="absolute inset-x-0 top-0 h-[38rem]"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -10%, color-mix(in oklch, var(--brand) 13%, transparent), transparent 70%)",
        }}
      />

      {/* drafting paper */}
      <div
        className="absolute inset-0 opacity-[0.55] dark:opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklch, var(--border) 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--border) 55%, transparent) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to bottom, black, transparent 65%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 65%)",
        }}
      />

      {/* grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply dark:opacity-[0.05] dark:mix-blend-screen"
        style={{ backgroundImage: `url("${GRAIN}")`, backgroundRepeat: "repeat" }}
      />
    </div>
  );
}

/**
 * Closes a page off rather than letting it trail into whitespace. Repeats the
 * path motif as a rule, which is the same idea as the strip at the top.
 */
export function Footer() {
  return (
    <footer className="mt-auto pt-16">
      <div className="mx-auto w-full max-w-[88rem] px-6 pb-8">
        <div className="rule-brand mb-3 h-px w-full opacity-40" />
        <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
          Playbook &middot; one goal at a time
        </p>
      </div>
    </footer>
  );
}
