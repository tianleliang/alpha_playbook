import { Chip, Panel } from "@/components/panel";
import { activeOpportunities } from "@/core/flow";
import type { Opportunity, Project } from "@/core/types";

import { CloseForm } from "./CloseForm";

/**
 * What you actually took on. Each one remembers exactly which scan and which
 * result it came from, so the trail back is never lost.
 */
export function OpportunitiesPanel({ project }: { project: Project }) {
  const active = activeOpportunities(project);
  if (active.length === 0) return null;

  return (
    <Panel title="Opportunities" meta={<Chip tone="live">{active.length} active</Chip>}>
      <ul className="flex flex-col gap-3">
        {active.map((opportunity) => (
          <OpportunityRow key={opportunity.id} projectId={project.id} opportunity={opportunity} />
        ))}
      </ul>
    </Panel>
  );
}

function OpportunityRow({
  projectId,
  opportunity,
}: {
  projectId: string;
  opportunity: Opportunity;
}) {
  return (
    <li className="border-border rounded-lg border p-4">
      <h4 className="leading-snug font-medium">{opportunity.title}</h4>
      <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{opportunity.summary}</p>

      <dl className="mt-3 flex flex-col gap-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground shrink-0">Do next</dt>
          <dd>{opportunity.suggestedAction}</dd>
        </div>
      </dl>

      <p className="text-muted-foreground mt-3 font-mono text-[10px]">
        {opportunity.stepId} &middot; from {opportunity.sourceScanId} {opportunity.sourceResultId}
        {opportunity.nodeId ? ` via ${opportunity.nodeId}` : " (wildcard)"}
      </p>

      <CloseForm projectId={projectId} opportunityId={opportunity.id} />
    </li>
  );
}
