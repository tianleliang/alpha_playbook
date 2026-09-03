import Link from "next/link";

export const metadata = {
  title: "Playbook",
  description: "Turn one goal into a plan built on what you already have.",
};

const STEPS: Array<[string, string]> = [
  ["Tell it about yourself", "Paste a resume and answer three questions. Once, ever."],
  [
    "Say what you want",
    "Four fields. It researches the target and tells you how it actually works.",
  ],
  [
    "Get a plan",
    "Timeline steps working backwards from your deadline, each one naming the advantage it uses.",
  ],
  [
    "Run an opportunity scan",
    "It searches for real programs, people and openings that move your current step, with links, deadlines, and the first message to send.",
  ],
  [
    "Do them, log them",
    "When you finish something, it judges whether the step is genuinely done before moving you on.",
  ],
];

const COMING = [
  "Editing generated work, rather than only approving or regenerating it",
  "A daily view that surfaces what to do today, not just this step",
  "Importing a richer personal history than a resume can carry",
  "Scheduled scans, once the results are worth automating",
];

/**
 * The front door.
 *
 * Two ways in. The demo is first because it costs nothing and shows the real
 * output immediately; signing up means several minutes of live generation
 * before there is anything to look at.
 */
export default function WelcomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-6 py-20 sm:py-28">
      <header className="flex flex-col gap-5">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          One goal. A plan built on what you already have.
        </h1>
        <p className="text-muted-foreground max-w-prose text-lg leading-relaxed">
          Most planning tools hand everyone the same advice. This one reads your actual background, researches what you are chasing, and works backwards from it. Then it goes and finds real programs, real people, real deadlines for the step you are on right now.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/demo"
          className="border-[var(--brand)] bg-[var(--brand)] text-[var(--primary-foreground)] shadow-[0_2px_10px_-4px_var(--brand)] rounded-lg border px-5 py-3 text-sm font-medium"
        >
          See a real run
        </Link>
        <Link
          href="/login"
          className="border-border hover:border-foreground/40 rounded-lg border px-5 py-3 text-sm font-medium transition-colors"
        >
          Run your own goal
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
          What happens
        </h2>
        <ol className="flex flex-col gap-3 text-[15px] leading-relaxed">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="text-muted-foreground mt-0.5 font-mono text-xs tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="font-medium">{title}</span>
                <span className="text-muted-foreground"> &mdash; {body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground text-sm">
          A real plan takes a few minutes to build. The demo skips the wait.
        </p>
      </section>

      <section className="border-border flex flex-col gap-3 rounded-xl border border-dashed p-5">
        <h2 className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
          Still being built
        </h2>
        <ul className="text-muted-foreground flex flex-col gap-1.5 text-sm leading-relaxed">
          {COMING.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
