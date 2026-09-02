import { Chip, Field, Panel } from "@/components/panel";
import { latestScan, nodesForStep, untriagedResults } from "@/core/flow";
import type { Project } from "@/core/types";
import { NODE_LABEL } from "@/features/nodes/NodesPanel";

import { ResultCard } from "./ResultCard";

/**
 * The latest scan for the current step, grouped the way it was searched:
 * one section per leverage direction, then anything the directions missed.
 */
export function ScanPanel({ project }: { project: Project }) {
  const scan = latestScan(project);
  if (!scan) return null;

  const nodes = nodesForStep(project, scan.stepId);
  const waiting = untriagedResults(scan).length;
  const wildcards = scan.results.filter((r) => r.isWildcard);

  return (
    <Panel
      title="What it found"
      meta={
        <div className="flex items-center gap-2">
          <Chip>{scan.id}</Chip>
          {waiting > 0 ? (
            <Chip tone="live">{waiting} to decide</Chip>
          ) : (
            <Chip tone="done">All decided</Chip>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-muted-foreground text-sm leading-relaxed">{scan.summary}</p>

        {nodes.map((node) => {
          const results = scan.results.filter((r) => r.nodeId === node.id);
          const skipped = scan.emptyOrRejected.find((e) => e.nodeId === node.id);

          return (
            <div key={node.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="border-border text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
                  {NODE_LABEL[node.nodeType]}
                </span>
                <span className="text-sm font-medium">{node.phrase}</span>
              </div>

              {results.length === 0 ? (
                <p className="text-muted-foreground pl-1 text-sm italic">
                  {skipped?.reason ?? "Nothing worth your attention here this time."}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {results.map((result) => (
                    <ResultCard key={result.id} projectId={project.id} result={result} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {wildcards.length > 0 && (
          <Field label="Also worth a look">
            <ul className="mt-1 flex flex-col gap-3">
              {wildcards.map((result) => (
                <ResultCard key={result.id} projectId={project.id} result={result} />
              ))}
            </ul>
          </Field>
        )}

        <p className="border-border border-t pt-4 text-sm">
          <span className="text-muted-foreground">Suggested: </span>
          {scan.nextBestAction}
        </p>
      </div>
    </Panel>
  );
}
