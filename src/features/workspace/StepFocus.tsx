import { Bullets, Field } from "@/components/panel";
import { currentStep } from "@/core/flow";
import type { Project } from "@/core/types";

/**
 * What you are working on, and why.
 *
 * Sits above the to-do list so no task is ever orphaned from its reason. The
 * step number, the outcome, the advantage being used, and what would count as
 * done - four things, and none of them require going to read the plan.
 */
export function StepFocus({ project }: { project: Project }) {
  const step = currentStep(project);
  const steps = project.plan?.steps ?? [];
  if (!step) return null;

  const index = steps.findIndex((s) => s.id === step.id);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
          Step {index + 1} of {steps.length} &middot; {step.dateRange}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{step.title}</h1>
        <p className="text-muted-foreground leading-relaxed">{step.goal}</p>
      </div>

      <p className="border-foreground/20 border-l-2 pl-3 text-sm leading-relaxed">
        {step.asymmetricMove}
      </p>

      <Field label="This step is done when">
        <Bullets items={step.completionSignals} />
      </Field>
    </section>
  );
}
