import { Chip, Panel } from "@/components/panel";
import { currentStep, latestScan } from "@/core/flow";
import type { LeverageNode, NodeType, Project } from "@/core/types";

export const NODE_LABEL: Record<NodeType, string> = {
  people: "People",
  communities: "Communities",
  standard_programs: "Programs",
  artifacts_side_projects: "Build",
  direct_opportunities: "Openings",
};

/**
 * What the scan goes looking for.
 *
 * The plan can have a dozen steps and twenty-odd directions between them, which
 * is far more than anyone needs on screen at once. So this shows the current
 * step's directions and folds the rest away - and once a scan has run, the
 * whole panel folds, because the results screen already shows each direction
 * above the things it found.
 */
export function NodesPanel({ project }: { project: Project }) {
  const { nodeSet, plan } = project;
  if (!nodeSet || !plan) return null;

  const step = currentStep(project);
  const approved = nodeSet.status === "approved";
  const scanned = Boolean(latestScan(project));

  const mine = nodeSet.nodes.filter((n) => n.stepId === step?.id);
  const later = plan.steps
    .filter((s) => s.id !== step?.id && s.status !== "complete")
    .map((s) => ({ step: s, nodes: nodeSet.nodes.filter((n) => n.stepId === s.id) }))
    .filter((entry) => entry.nodes.length > 0);

  // Once results exist they tell this story better. Stay out of the way.
  if (scanned) {
    return (
      <details className="group border-border bg-card rounded-lg border">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm">
          <span className="font-medium">Leverage Nodes</span>
          <span className="text-muted-foreground text-xs">
            {nodeSet.nodes.length} nodes across the plan
          </span>
        </summary>
        <div className="border-border border-t px-4 py-4">
          <Body current={mine} later={later} stepTitle={step?.title} />
        </div>
      </details>
    );
  }

  return (
    <Panel
      title="Leverage Nodes"
      meta={approved ? <Chip tone="done">Approved</Chip> : <Chip tone="live">Needs your review</Chip>}
    >
      <Body current={mine} later={later} stepTitle={step?.title} />
    </Panel>
  );
}

function Body({
  current,
  later,
  stepTitle,
}: {
  current: LeverageNode[];
  later: Array<{ step: { id: string; title: string }; nodes: LeverageNode[] }>;
  stepTitle?: string;
}) {
  const laterCount = later.reduce((n, e) => n + e.nodes.length, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <p className="text-muted-foreground text-sm">
          {stepTitle ? `For what you are on now: ${stepTitle}` : "For your current step"}
        </p>
        {current.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            Nothing external to search for on this step. That is a normal answer.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {current.map((node) => (
              <NodeRow key={node.id} node={node} />
            ))}
          </ul>
        )}
      </div>

      {laterCount > 0 && (
        <details className="border-border border-t pt-4">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none text-sm underline-offset-4 hover:underline">
            {laterCount} more on later steps
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            {later.map(({ step, nodes }) => (
              <div key={step.id}>
                <p className="text-muted-foreground mb-1.5 text-sm">{step.title}</p>
                <ul className="flex flex-col gap-1.5">
                  {nodes.map((node) => (
                    <NodeRow key={node.id} node={node} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function NodeRow({ node }: { node: LeverageNode }) {
  return (
    <li className="flex flex-wrap items-baseline gap-2 text-sm leading-relaxed">
      <span className="border-border text-muted-foreground shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px]">
        {NODE_LABEL[node.nodeType]}
      </span>
      <span>{node.phrase}</span>
    </li>
  );
}
