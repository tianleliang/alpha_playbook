import { Chip, Panel } from "@/components/panel";
import type { LeverageNode, NodeType, Project } from "@/core/types";

export const NODE_LABEL: Record<NodeType, string> = {
  people: "People",
  communities: "Communities",
  standard_programs: "Programs",
  artifacts_side_projects: "Build",
  direct_opportunities: "Openings",
};

/**
 * Search directions, grouped by step. These are what the scan goes looking
 * for - they are not opportunities themselves, and a step with none is fine.
 */
export function NodesPanel({ project }: { project: Project }) {
  const { nodeSet, plan } = project;
  if (!nodeSet || !plan) return null;

  const approved = nodeSet.status === "approved";

  return (
    <Panel
      title="What to look for"
      meta={approved ? <Chip tone="done">Approved</Chip> : <Chip tone="live">Needs your review</Chip>}
    >
      <div className="flex flex-col gap-5">
        {plan.steps.map((step) => {
          const nodes = nodeSet.nodes.filter((n) => n.stepId === step.id);
          const isCurrent = step.status === "current";
          return (
            <div key={step.id} className={isCurrent ? "" : "opacity-60"}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-mono text-[11px]">{step.id}</span>
                <span className="text-sm font-medium">{step.title}</span>
                {isCurrent && <Chip tone="live">Now</Chip>}
              </div>
              {nodes.length === 0 ? (
                <p className="text-muted-foreground pl-1 text-sm italic">
                  Nothing external to search for on this step.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {nodes.map((node) => (
                    <NodeRow key={node.id} node={node} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
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
