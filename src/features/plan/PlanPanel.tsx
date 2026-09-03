import { Check } from "lucide-react";

import { Bullets, Chip, Field, Panel } from "@/components/panel";
import type { Project, Step } from "@/core/types";

/**
 * The plan, with the timeline first.
 *
 * The advantage is shown on each step rather than buried in a section at the
 * bottom - if you have to scroll to find out why the plan is personal, it
 * might as well not be.
 */
export function PlanPanel({ project }: { project: Project }) {
  const plan = project.plan;
  if (!plan) return null;

  const approved = plan.status === "approved";

  return (
    <Panel
      title="Plan"
      meta={
        <div className="flex items-center gap-2">
          <Chip>{plan.id}</Chip>
          {approved ? <Chip tone="done">Approved</Chip> : <Chip tone="live">Needs your review</Chip>}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Field label="First move">
          <p className="text-[15px] leading-relaxed font-medium">{plan.firstMove}</p>
        </Field>

        <ol className="flex flex-col gap-3">
          {plan.steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </ol>

        <details className="group">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none text-sm underline-offset-4 hover:underline">
            Why this plan &mdash; diagnosis, thesis, risks
          </summary>
          <div className="mt-5 flex flex-col gap-5">
            <Field label="What is actually in the way">
              <Bullets items={plan.strategicDiagnosis} />
            </Field>
            <Field label="The bet">
              <Bullets items={plan.asymmetricThesis} />
            </Field>
            <Field label="Built on">
              <ul className="flex flex-col gap-2.5">
                {plan.memoryBasis.map((item, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    <span className="font-medium">{item.fact}</span>
                    <span className="text-muted-foreground"> &mdash; {item.strategicImplication}</span>
                  </li>
                ))}
              </ul>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Gaps">
                <Bullets items={plan.keyGaps} />
              </Field>
              <Field label="Risks">
                <Bullets items={plan.risks} />
              </Field>
            </div>
            <Field label="Deliberately not doing">
              <Bullets items={plan.notNow} />
            </Field>
          </div>
        </details>

        {approved && plan.approval && (
          <p className="text-muted-foreground text-xs">
            Approved {new Date(plan.approval.approvedAt).toLocaleString()}
          </p>
        )}
      </div>
    </Panel>
  );
}

function StepRow({ step }: { step: Step }) {
  const current = step.status === "current";
  const complete = step.status === "complete";

  return (
    <li
      className={`rounded-lg border p-4 ${
        current
          ? "border-[var(--brand)]/45 bg-[var(--brand)]/[0.06]"
          : complete
            ? "border-border/60 opacity-70"
            : "border-border/60"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-muted-foreground font-mono text-[11px]">{step.dateRange}</span>
        {current && <Chip tone="live">Now</Chip>}
        {complete && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--done)]">
            <Check className="size-3" /> Done
          </span>
        )}
      </div>

      <h3 className={`mt-1.5 leading-snug font-medium ${complete ? "line-through" : ""}`}>
        {step.title}
      </h3>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{step.goal}</p>

      <p className="border-foreground/15 mt-3 border-l-2 pl-3 text-sm leading-relaxed">
        {step.asymmetricMove}
      </p>

      {current && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Moves">
            <Bullets items={step.importantMoves} />
          </Field>
          <Field label="Done when">
            <Bullets items={step.completionSignals} />
          </Field>
        </div>
      )}
    </li>
  );
}
