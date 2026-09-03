import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getProvider } from "@/ai";
import { Chip } from "@/components/panel";
import {
  currentStep,
  finishedForCurrentStep,
  latestScan,
  nextAction,
  nodesForStep,
  stageOf,
} from "@/core/flow";
import { readProject } from "@/core/store";
import { BriefPanel } from "@/features/brief/BriefPanel";
import { NodesPanel } from "@/features/nodes/NodesPanel";
import { TodoList } from "@/features/opportunities/TodoList";
import { PlanPanel } from "@/features/plan/PlanPanel";
import { StepRail } from "@/features/plan/StepRail";
import { ReviewPanel } from "@/features/review/ReviewPanel";
import { ScanPanel } from "@/features/scan/ScanPanel";
import { ScanTriage } from "@/features/scan/ScanTriage";
import { HealthPanel } from "@/features/workspace/HealthPanel";
import { NextActionCard } from "@/features/workspace/NextActionCard";
import { ReferenceRail, type View } from "@/features/workspace/ReferenceRail";
import { StepFocus } from "@/features/workspace/StepFocus";
import { NODE_LABEL } from "@/features/nodes/NodesPanel";

const VIEWS: View[] = ["brief", "plan", "directions", "results"];

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const project = await readProject(id);
  if (!project) notFound();

  const requested = typeof query.view === "string" ? (query.view as View) : undefined;
  const view = requested && VIEWS.includes(requested) ? requested : undefined;

  const stage = stageOf(project);
  const action = nextAction(project);
  const step = currentStep(project);
  const scan = latestScan(project);
  const provider = getProvider();

  const counts = {
    steps: project.plan?.steps.length ?? 0,
    directions: step ? nodesForStep(project, step.id).length : 0,
    finished: finishedForCurrentStep(project).length,
  };

  // Results are grouped under the direction that found them, wildcards last.
  const triageGroups = scan
    ? [
        ...nodesForStep(project, scan.stepId).map((node) => ({
          label: node.phrase,
          hint: NODE_LABEL[node.nodeType],
          results: scan.results.filter((r) => r.nodeId === node.id),
        })),
        ...(scan.results.some((r) => r.isWildcard)
          ? [
              {
                label: "Also worth a look",
                results: scan.results.filter((r) => r.isWildcard),
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row lg:gap-12 lg:py-12">
      {/* Left rail: where you are, and everything already settled. */}
      <aside className="flex shrink-0 flex-col gap-8 lg:sticky lg:top-12 lg:h-fit lg:w-60">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-3.5" />
          All goals
        </Link>

        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
            Goal
          </p>
          <p className="text-sm leading-snug font-medium text-balance">{project.title}</p>
        </div>

        {project.plan && <StepRail project={project} />}
        <ReferenceRail project={project} active={view} />

        {provider.isMock && <Chip>{provider.name}</Chip>}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-6">
        {view ? (
          <Reference project={project} view={view} />
        ) : (
          <>
            {action && (
              <NextActionCard projectId={project.id} action={action} counts={counts} />
            )}

            {stage === "scan_triage" && scan ? (
              <section className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <h1 className="text-2xl font-semibold tracking-tight">Opportunity Scan</h1>
                  <p className="text-muted-foreground text-sm">
                    Tick anything you would genuinely act on. The rest is set aside.
                  </p>
                </div>
                <ScanTriage projectId={project.id} scan={scan} groups={triageGroups} />
              </section>
            ) : (
              <>
                <ReviewPanel project={project} />
                {(stage === "active_work" || stage === "finished_evidence") && (
                  <>
                    <StepFocus project={project} />
                    <TodoList project={project} />
                  </>
                )}
                {stage === "brief_review" && <BriefPanel project={project} />}
                {stage === "plan_proposed" && <PlanPanel project={project} />}
                {stage === "nodes_proposed" && <NodesPanel project={project} />}
                {stage === "nodes_approved" && <StepFocus project={project} />}
              </>
            )}

            <HealthPanel project={project} />
          </>
        )}
      </main>
    </div>
  );
}

/** One settled artifact, opened at full width. */
function Reference({ project, view }: { project: Project; view: View }) {
  switch (view) {
    case "brief":
      return <BriefPanel project={project} />;
    case "plan":
      return <PlanPanel project={project} />;
    case "directions":
      return <NodesPanel project={project} />;
    case "results":
      return <ScanPanel project={project} />;
  }
}

type Project = NonNullable<Awaited<ReturnType<typeof readProject>>>;
