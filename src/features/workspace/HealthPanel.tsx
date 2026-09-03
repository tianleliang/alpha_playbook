import { AlertTriangle, Check } from "lucide-react";

import { checkProject } from "@/core/validate";
import type { Project } from "@/core/types";

/**
 * Everything that should still be true about this project. Collapsed when
 * clean, which is the normal case.
 */
export function HealthPanel({ project }: { project: Project }) {
  const warnings = checkProject(project);
  const counts = [
    project.plan?.steps.length ?? 0,
    project.nodeSet?.nodes.length ?? 0,
    project.scans.reduce((n, s) => n + s.results.length, 0),
    project.opportunities.length,
    project.reviews.length,
  ];
  const total = counts.reduce((a, b) => a + b, 0) + (project.plan ? 1 : 0) + 1;

  return (
    <details className="group border-border bg-card rounded-lg border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm">
        <span className="flex items-center gap-2">
          {warnings.length === 0 ? (
            <Check className="size-3.5 text-[var(--done)]" />
          ) : (
            <AlertTriangle className="size-3.5 text-[var(--brand)]" />
          )}
          <span className="font-medium">
            {warnings.length === 0 ? "Everything checks out" : `${warnings.length} things to look at`}
          </span>
        </span>
        <span className="text-muted-foreground font-mono text-[11px]">
          {total} objects checked
        </span>
      </summary>

      <div className="border-border border-t px-4 py-4">
        {warnings.length === 0 ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Every step, direction, result, opportunity and review points at something that exists,
            ids are unique, and nothing has drifted out of date.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {warnings.map((warning, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                  {warning.where}
                </span>
                <span>{warning.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
