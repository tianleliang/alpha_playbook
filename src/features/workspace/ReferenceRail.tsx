import Link from "next/link";

import { latestScan } from "@/core/flow";
import type { Project } from "@/core/types";

export type View = "brief" | "plan" | "directions" | "results";

/**
 * Everything already settled, in the order it was made.
 *
 * These are reference, not work. Keeping them out of the main column is the
 * whole point - by the time you are executing a step, the brief and the plan
 * are things you occasionally check, not things you read top to bottom.
 *
 * Clicking one opens it at full width rather than in a cramped drawer.
 */
export function ReferenceRail({ project, active }: { project: Project; active?: View }) {
  const scan = latestScan(project);

  const entries: Array<{ view: View; label: string; note: string; ready: boolean }> = [
    {
      view: "brief",
      label: "Brief",
      note: "The researched target",
      ready: true,
    },
    {
      view: "plan",
      label: "Plan",
      note: project.plan ? `${project.plan.steps.length} steps` : "Not built yet",
      ready: Boolean(project.plan),
    },
    {
      view: "directions",
      label: "Leverage Nodes",
      note: project.nodeSet ? `${project.nodeSet.nodes.length} nodes` : "Not built yet",
      ready: Boolean(project.nodeSet),
    },
    {
      view: "results",
      label: "Opportunity Scan",
      note: scan ? `${scan.results.length} results` : "Not run yet",
      ready: Boolean(scan),
    },
  ];

  return (
    <nav aria-label="Reference" className="flex flex-col gap-3">
      <h2 className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
        Reference
      </h2>

      <ul className="flex flex-col gap-1">
        {entries.map((entry) => {
          const isActive = active === entry.view;

          if (!entry.ready) {
            return (
              <li
                key={entry.view}
                className="text-muted-foreground/50 flex flex-col gap-0.5 rounded-md px-2.5 py-2 text-sm"
              >
                <span>{entry.label}</span>
                <span className="text-[11px]">{entry.note}</span>
              </li>
            );
          }

          return (
            <li key={entry.view}>
              <Link
                href={`/project/${project.id}?view=${entry.view}`}
                className={`flex flex-col gap-0.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-foreground/[0.06] font-medium"
                    : "hover:bg-foreground/[0.04] text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{entry.label}</span>
                <span className="text-[11px] opacity-70">{entry.note}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {active && (
        <Link
          href={`/project/${project.id}`}
          className="text-muted-foreground hover:text-foreground mt-1 px-2.5 text-sm underline-offset-4 hover:underline"
        >
          &larr; Back to what I am doing
        </Link>
      )}
    </nav>
  );
}
