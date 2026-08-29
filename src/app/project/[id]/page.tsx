import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getProvider } from "@/ai";
import { Chip } from "@/components/panel";
import { STAGE_LABEL, nextAction, stageOf } from "@/core/flow";
import { readProject } from "@/core/store";
import { BriefPanel } from "@/features/brief/BriefPanel";
import { NodesPanel } from "@/features/nodes/NodesPanel";
import { OpportunitiesPanel } from "@/features/opportunities/OpportunitiesPanel";
import { PlanPanel } from "@/features/plan/PlanPanel";
import { ReviewPanel } from "@/features/review/ReviewPanel";
import { ScanPanel } from "@/features/scan/ScanPanel";
import { HealthPanel } from "@/features/workspace/HealthPanel";
import { NextActionCard } from "@/features/workspace/NextActionCard";

export default async function ProjectPage({ params }: PageProps<"/project/[id]">) {
  const { id } = await params;
  const project = await readProject(id);
  if (!project) notFound();

  const action = nextAction(project);
  const provider = getProvider();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:py-14">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-3.5" />
            All goals
          </Link>
          {provider.isMock && <Chip>{provider.name}</Chip>}
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {project.title}
          </h1>
          <p className="text-muted-foreground text-sm">{STAGE_LABEL[stageOf(project)]}</p>
        </div>
      </header>

      {action && <NextActionCard projectId={project.id} action={action} />}

      {/* Ordered by what you look at most, not by when it was made. */}
      <ReviewPanel project={project} />
      {project.plan && <PlanPanel project={project} />}
      <ScanPanel project={project} />
      <OpportunitiesPanel project={project} />
      {project.nodeSet && <NodesPanel project={project} />}
      <BriefPanel project={project} />
      <HealthPanel project={project} />
    </main>
  );
}
