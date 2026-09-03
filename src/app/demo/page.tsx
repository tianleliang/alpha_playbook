import Link from "next/link";

import demoProfile from "@/demo/profile.json";
import demoProject from "@/demo/project.json";
import { Bullets, Field, Panel } from "@/components/panel";
import { currentStep, nodesForStep } from "@/core/flow";
import type { Profile, Project } from "@/core/types";
import { BriefPanel } from "@/features/brief/BriefPanel";
import { Annotation, InertNote } from "@/features/demo/Annotation";
import { DEMO_STEPS, DemoPager, DemoProgress } from "@/features/demo/DemoNav";
import { ReadOnly } from "@/features/demo/ReadOnly";
import { NODE_LABEL, NodesPanel } from "@/features/nodes/NodesPanel";
import { TodoList } from "@/features/opportunities/TodoList";
import { PlanPanel } from "@/features/plan/PlanPanel";
import { StepRail } from "@/features/plan/StepRail";
import { ScanTriage } from "@/features/scan/ScanTriage";
import { StepFocus } from "@/features/workspace/StepFocus";

const project = demoProject as unknown as Project;
const profile = demoProfile as unknown as Profile;

export const metadata = {
  title: "Playbook - a real run",
  description: "Walk through a goal that was researched, planned, scouted, and started.",
};

/**
 * The same six stages a real user walks, already generated.
 *
 * Everything here came out of the live pipeline. It is frozen so it loads
 * instantly and cannot be changed by whoever looks at it next, and annotated
 * so a stranger can tell what the system decided on its own versus what the
 * person chose.
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row lg:gap-12 lg:py-12">
        <aside className="flex shrink-0 flex-col gap-7 lg:sticky lg:top-12 lg:h-fit lg:w-56">
          <Link
            href="/welcome"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            &larr; Playbook
          </Link>

          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
              A saved run
            </p>
            <p className="text-sm leading-snug font-medium text-balance">{project.title}</p>
          </div>

          <DemoProgress current={index} />

          <p className="text-muted-foreground text-xs leading-relaxed">
            Every stage below was generated live. Nothing here can be changed.
          </p>
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

const SECTIONS: Array<{ key: keyof Profile; label: string }> = [
  { key: "currentState", label: "Where they are" },
  { key: "capabilities", label: "What they can do" },
  { key: "credibilityAndAssets", label: "What they have built" },
  { key: "relationshipsAndAccess", label: "Who they know" },
  { key: "directionAndLogic", label: "Where they are heading" },
  { key: "underusedLeverage", label: "Not being used yet" },
  { key: "unknowns", label: "Still unclear" },
];

function ProfileStage() {
  return (
    <>
      <Annotation>
        <p>
          Onboarding asks for a resume and three short questions. That is the whole of it, and it
          happens once.
        </p>
        <p>
          What comes back is this: the same seven buckets every time, so later stages always know
          where to look. Notice <strong>Not being used yet</strong> &mdash; that is the only
          section the system infers rather than reads, and it is what makes the plan interesting
          later.
        </p>
      </Annotation>

      <Panel title="Profile" meta={<span className="text-muted-foreground text-xs">Generated once</span>}>
        <div className="grid gap-5 sm:grid-cols-2">
          {SECTIONS.map((section) => {
            const items = profile[section.key] as string[];
            if (!items?.length) return null;
            return (
              <Field key={section.key} label={section.label}>
                <Bullets items={items} />
              </Field>
            );
          })}
        </div>
      </Panel>

      <InertNote>
        you would paste your own background here, or upload a PDF. It is never shown to anyone else.
      </InertNote>
    </>
  );
}

function BriefStage() {
  return (
    <>
      <Annotation>
        <p>
          The user typed four things: what they want, how they would know they succeeded, by when,
          and anything limiting them. Nothing else.
        </p>
        <p>
          The system then searched the web and wrote this. It describes the <em>target</em>, not the
          person &mdash; this stage is deliberately never shown the profile, so the research cannot
          be bent to flatter whoever is reading it. Every external claim carries a source.
        </p>
      </Annotation>

      <BriefPanel project={project} />
    </>
  );
}

function PlanStage() {
  return (
    <>
      <Annotation>
        <p>
          Now the two are combined: the researched brief, and the profile from the first screen.
          This stage has no web access &mdash; it is reasoning, not searching.
        </p>
        <p>
          Open a step and look at the line under the goal. That is the specific advantage the step
          uses. If a plan could be handed to anyone else unchanged, it has failed, and that line is
          where you check.
        </p>
      </Annotation>

      <PlanPanel project={project} />
    </>
  );
}

function NodesStage() {
  const step = currentStep(project);
  const forStep = step ? nodesForStep(project, step.id).length : 0;

  return (
    <>
      <Annotation>
        <p>
          Before searching for anything, the system decides <em>what kinds of things</em> are worth
          searching for on each step. These are directions, not results.
        </p>
        <p>
          There are {project.nodeSet?.nodes.length} across the plan and {forStep} on the current
          step, sorted into people, communities, programs, things to build, and openings. A step
          with none is a valid answer &mdash; some steps have nothing external to find.
        </p>
      </Annotation>

      <NodesPanel project={project} />

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
    </>
  );
}

function ScanStage() {
  const scan = project.scans[0];
  const step = currentStep(project);
  const saved = scan.results.filter((r) => r.status === "saved").length;

  const groups = [
    ...(step
      ? nodesForStep(project, step.id).map((node) => ({
          label: node.phrase,
          hint: NODE_LABEL[node.nodeType],
          results: scan.results.filter((r) => r.nodeId === node.id),
        }))
      : []),
    {
      label: "Also worth a look",
      results: scan.results.filter((r) => r.isWildcard),
    },
  ].filter((g) => g.results.length > 0);

  return (
    <>
      <Annotation>
        <p>
          This is a real search, run against the current step only. It returned{" "}
          {scan.results.length} results with live links and real deadlines.
        </p>
        <p>
          The person kept <strong>{saved}</strong> &mdash; shown ticked and highlighted below. In
          the live app you tick what you would genuinely act on and press one button; everything
          else is set aside without you having to refuse it one at a time.
        </p>
      </Annotation>

      <ScanTriage projectId="demo" scan={scan} groups={groups} />

      <InertNote>
        the ticked results become your list on the next screen, each one keeping a trail back to the
        scan and the direction that found it.
      </InertNote>
    </>
  );
}

function DashboardStage() {
  const step = currentStep(project);
  const steps = project.plan?.steps ?? [];
  const nextUp = steps[steps.findIndex((s) => s.id === step?.id) + 1];

  return (
    <>
      <Annotation>
        <p>
          This is where you live once a goal is running. The step you are on, why it matters, and
          the things you chose to do about it.
        </p>
        <p>
          Nothing here nags you to log anything. When you actually finish something, you record what
          happened and what changed &mdash; and only then does the system judge whether this step is
          genuinely done.
        </p>
      </Annotation>

      <div className="border-border rounded-xl border p-5 lg:hidden">
        <StepRail project={project} />
      </div>

      <StepFocus project={project} />
      <TodoList project={project} />

      <Annotation label="What happens next">
        <p>
          Finish one of these and press <strong>Record what happened</strong>. The system reads only
          the finished work on this step &mdash; never your profile, because whether a step is done
          is a question about evidence, not about how capable you are &mdash; and returns one of
          four verdicts.
        </p>
        <p>
          If it says you are ready, you approve and{" "}
          {nextUp ? <strong>{nextUp.title}</strong> : <strong>the next step</strong>} becomes
          current. If it says not yet, you can disagree and move on anyway. It advises; you decide.
        </p>
      </Annotation>

      <InertNote>
        these buttons are inert here so the saved run stays the same for the next person.
      </InertNote>
    </>
  );
}
