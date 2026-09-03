import { Check } from "lucide-react";

import type { Project } from "@/core/types";

/**
 * Where you are in the plan.
 *
 * Dots on a line: filled behind you, ringed where you are, hollow ahead. It is
 * the answer to "why am I doing this" without having to go and read the plan
 * again, and it only moves when a step genuinely completes - progress here is
 * never decorative.
 */
export function StepRail({ project }: { project: Project }) {
  const steps = project.plan?.steps ?? [];
  if (steps.length === 0) return null;

  const doneCount = steps.filter((s) => s.status === "complete").length;

  return (
    <nav aria-label="Plan progress" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
          Your path
        </h2>
        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
          {doneCount}/{steps.length}
        </span>
      </div>

      <ol className="flex flex-col">
        {steps.map((step, i) => {
          const done = step.status === "complete";
          const current = step.status === "current";
          const last = i === steps.length - 1;

          return (
            <li key={step.id} className="flex gap-3">
              {/* dot + connecting line */}
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-emerald-600 bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-500"
                      : current
                        ? "border-amber-500 bg-background ring-3 ring-amber-500/20"
                        : "border-muted-foreground/25 bg-background"
                  }`}
                >
                  {done && <Check className="text-background size-2" strokeWidth={4} />}
                </span>
                {!last && (
                  <span
                    className={`w-px flex-1 ${
                      done ? "bg-emerald-600/40 dark:bg-emerald-500/40" : "bg-border"
                    }`}
                    style={{ minHeight: current ? 34 : 22 }}
                  />
                )}
              </div>

              <div className={`pb-3 ${last ? "" : ""}`}>
                <p className="text-muted-foreground font-mono text-[10px]">{step.dateRange}</p>
                <p
                  className={`text-[13px] leading-snug ${
                    current
                      ? "font-medium"
                      : done
                        ? "text-muted-foreground line-through"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
