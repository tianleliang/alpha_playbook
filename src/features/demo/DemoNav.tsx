import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface DemoStep {
  slug: string;
  label: string;
  /** The one line at the top of this stage. */
  headline: string;
}

/**
 * The six stages of a real run, in order.
 *
 * A reviewer walks this exactly the way a user walks the live app - same
 * sequence, same screens - except each stage is already generated, so the
 * whole thing takes a minute rather than eight.
 */
export const DEMO_STEPS: DemoStep[] = [
  {
    slug: "profile",
    label: "Profile",
    headline: "First, who is this person?",
  },
  {
    slug: "brief",
    label: "Brief",
    headline: "What are they actually aiming at?",
  },
  {
    slug: "plan",
    label: "Plan",
    headline: "A path built from their goal and their background",
  },
  {
    slug: "nodes",
    label: "Leverage Nodes",
    headline: "What each step should go looking for",
  },
  {
    slug: "scan",
    label: "Opportunity Scan",
    headline: "Real programs, people and openings",
  },
  {
    slug: "dashboard",
    label: "Working on it",
    headline: "The day to day",
  },
];

/** Where you are in the walkthrough, always visible. */
export function DemoProgress({ current }: { current: number }) {
  return (
    <ol className="flex flex-col gap-0.5">
      {DEMO_STEPS.map((step, i) => {
        const done = i < current;
        const here = i === current;
        return (
          <li key={step.slug}>
            <Link
              href={`/demo?step=${step.slug}`}
              aria-current={here ? "step" : undefined}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                here
                  ? "bg-foreground/[0.06] font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
              }`}
            >
              <span
                className={`size-2 shrink-0 rounded-full ${
                  done
                    ? "bg-emerald-600 dark:bg-emerald-500"
                    : here
                      ? "bg-amber-500 ring-3 ring-amber-500/20"
                      : "bg-muted-foreground/25"
                }`}
              />
              {step.label}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** Back and next, at the bottom of every stage. */
export function DemoPager({ current }: { current: number }) {
  const previous = DEMO_STEPS[current - 1];
  const next = DEMO_STEPS[current + 1];

  return (
    <nav className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-6">
      {previous ? (
        <Link
          href={`/demo?step=${previous.slug}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-3.5" />
          {previous.label}
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          href={`/demo?step=${next.slug}`}
          className="border-foreground bg-foreground text-background inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium"
        >
          {next.label}
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <Link
          href="/login"
          className="border-foreground bg-foreground text-background inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium"
        >
          Run your own goal
          <ArrowRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
