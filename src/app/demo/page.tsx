import Link from "next/link";

import demoProject from "@/demo/project.json";
import { Field, Panel } from "@/components/panel";
import { currentStep, nodesForStep } from "@/core/flow";
import type { Project, ScanResult } from "@/core/types";
import { DEMO_STEPS, DemoPager, DemoProgress } from "@/features/demo/DemoNav";
import { ReadOnly } from "@/features/demo/ReadOnly";
import { IdentityCard, ResumeDocument } from "@/features/demo/ResumeDocument";
import { Spotlight, StageNote } from "@/features/demo/Spotlight";
import { NODE_LABEL, NodesPanel } from "@/features/nodes/NodesPanel";
import { TodoList } from "@/features/opportunities/TodoList";
import { PlanPanel } from "@/features/plan/PlanPanel";
import { StepRail } from "@/features/plan/StepRail";
import { ScanTriage } from "@/features/scan/ScanTriage";
import { StepFocus } from "@/features/workspace/StepFocus";

const project = demoProject as unknown as Project;

export const metadata = {
  title: "Playbook - a real run",
  description: "Walk through a goal that was researched, planned, scouted, and started.",
};

/**
 * The same six stages a real user walks, already generated.
 *
 * Annotated by pointing rather than explaining: a ring around the actual
 * control, a line, and a short note. A stage should take seconds to read.
 */
export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const slug = typeof query.step === "string" ? query.step : DEMO_STEPS[0].slug;
  const index = Math.max(
    0,
    DEMO_STEPS.findIndex((s) => s.slug === slug),
  );
  const step = DEMO_STEPS[index];

  return (
    <ReadOnly>
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-8 px-6 py-8 lg:flex-row lg:gap-10 lg:py-12">
        {/* Same rail on every stage: where you are in the demo, and the path. */}
        <aside className="flex shrink-0 flex-col gap-7 lg:sticky lg:top-12 lg:h-fit lg:w-56">
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
              A saved run
            </p>
            <p className="text-sm leading-snug font-medium text-balance">{project.title}</p>
          </div>

          <DemoProgress current={index} />
          <StepRail project={project} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex flex-col gap-1.5">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
              Step {index + 1} of {DEMO_STEPS.length} &middot; {step.label}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {step.headline}
            </h1>
          </header>

          <Stage slug={step.slug} />

          <DemoPager current={index} />
        </main>
      </div>
    </ReadOnly>
  );
}

function Stage({ slug }: { slug: string }) {
  switch (slug) {
    case "profile":
      return <ProfileStage />;
    case "brief":
      return <BriefStage />;
    case "plan":
      return <PlanStage />;
    case "nodes":
      return <NodesStage />;
    case "scan":
      return <ScanStage />;
    default:
      return <DashboardStage />;
  }
}

// ---------------------------------------------------------------- stages

function ProfileStage() {
  return (
    <div className="flex flex-col gap-6">
      <StageNote>Upload a resume, answer three questions. This happens once.</StageNote>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <Spotlight
            label="What you upload"
            note="A PDF or pasted text. Everything the system knows about you starts here."
          >
            <ResumeDocument />
          </Spotlight>
        </div>

        <div className="lg:w-56 lg:shrink-0">
          <IdentityCard />
        </div>
      </div>
    </div>
  );
}

function BriefStage() {
  const { brief } = project;

  return (
    <div className="flex flex-col gap-6">
      <StageNote>Four fields in. The system researches the target and reports back.</StageNote>

      <Spotlight
        label="What they typed"
        note="Only this. Nothing about the person is sent to this stage, so the research describes the target rather than flattering whoever asked."
      >
        <Panel title="The goal">
          <div className="flex flex-col gap-5">
            <Field label="Objective">
              <p className="text-[15px] leading-relaxed">{brief.objective}</p>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Done when">
                <p className="text-sm leading-relaxed">{brief.success}</p>
              </Field>
              <Field label="By">
                <p className="text-sm leading-relaxed">{brief.deadline}</p>
              </Field>
            </div>
          </div>
        </Panel>
      </Spotlight>

      <Spotlight
        label="What came back"
        side="below"
        note={
          <>
            A researched brief: how this target actually works, who gets in, and what it rewards,
            every claim carrying a source. <Link href="/demo?step=plan" className="underline underline-offset-2">The plan</Link>{" "}
            is built from it next.
          </>
        }
      >
        <Panel title="Brief" meta={<span className="text-muted-foreground text-xs">Researched</span>}>
          <Field label="What this target is">
            <p className="text-sm leading-relaxed">{brief.targetSummary}</p>
          </Field>
        </Panel>
      </Spotlight>
    </div>
  );
}

function PlanStage() {
  return (
    <div className="flex flex-col gap-6">
      <StageNote>
        The brief and the resume, combined. No searching here &mdash; this stage reasons.
      </StageNote>

      <Spotlight
        label="Read this line"
        note="Every step names the specific advantage it uses. If a plan could be handed to someone else unchanged, it failed."
      >
        <PlanPanel project={project} />
      </Spotlight>
    </div>
  );
}

function NodesStage() {
  const step = currentStep(project);
  const forStep = step ? nodesForStep(project, step.id).length : 0;

  return (
    <div className="flex flex-col gap-6">
      <StageNote>
        Before searching, the system decides what kinds of things are worth searching for.
      </StageNote>

      <div className="flex flex-wrap gap-2">
        {Object.values(NODE_LABEL).map((label) => (
          <span
            key={label}
            className="border-border text-muted-foreground rounded border px-2 py-1 font-mono text-[10px]"
          >
            {label}
          </span>
        ))}
      </div>

      <Spotlight
        label={`${forStep} on this step`}
        note="Directions, not results. A step with none is a valid answer - some have nothing external to find."
      >
        <NodesPanel project={project} />
      </Spotlight>
    </div>
  );
}

/** A few results, not the full sixteen. The point is the shape of the decision. */
function ScanStage() {
  const scan = project.scans[0];
  const step = currentStep(project);

  const trimmed: ScanResult[] = [
    ...scan.results.filter((r) => r.status === "saved").slice(0, 3),
    ...scan.results.filter((r) => r.status !== "saved").slice(0, 2),
  ];

  const groups = [
    ...(step
      ? nodesForStep(project, step.id).map((node) => ({
          label: node.phrase,
          hint: NODE_LABEL[node.nodeType],
          results: trimmed.filter((r) => r.nodeId === node.id),
        }))
      : []),
    { label: "Also worth a look", results: trimmed.filter((r) => r.isWildcard) },
  ].filter((g) => g.results.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <StageNote>
        A real web search against the current step. Live links, real deadlines. Showing{" "}
        {trimmed.length} of {scan.results.length}.
      </StageNote>

      <Spotlight
        label="One decision"
        note="Green ones were kept. You tick what you would act on and press one button - the rest is set aside without you refusing it one at a time."
      >
        <ScanTriage projectId="demo" scan={{ ...scan, results: trimmed }} groups={groups} />
      </Spotlight>
    </div>
  );
}

function DashboardStage() {
  const steps = project.plan?.steps ?? [];
  const step = currentStep(project);
  const nextUp = steps[steps.findIndex((s) => s.id === step?.id) + 1];

  return (
    <div className="flex flex-col gap-6">
      <StageNote>Where you live once a goal is running.</StageNote>

      <Spotlight
        label="Why this step"
        note="The outcome, the advantage it uses, and what would count as done. No task is orphaned from its reason."
      >
        <div className="border-border bg-card rounded-lg border p-5">
          <StepFocus project={project} />
        </div>
      </Spotlight>

      <TodoList
        project={project}
        spotlight={
          <>
            This is how you move forward. Finish something, then log what happened and what it
            changed. That evidence is what the system reads to decide whether this step is genuinely
            done &mdash; and if it agrees, {nextUp ? <strong>{nextUp.title}</strong> : "the next step"}{" "}
            becomes current. If it says not yet, you can disagree and move on anyway.
          </>
        }
      />
    </div>
  );
}
