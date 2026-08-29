"use server";

/**
 * Opportunity scans, and what you do with the results.
 *
 * A scan looks at the current step only, guided by that step's approved
 * directions. The scan record itself never changes after it is written -
 * saving or ignoring a result changes the result's status, and saving also
 * copies the result into your opportunities with its lineage attached.
 */

import { getProvider } from "@/ai";
import { currentStep, nodesForStep } from "@/core/flow";
import { opportunityId, resultId, scanId } from "@/core/ids";
import { mutate } from "@/core/mutate";
import { readProfile } from "@/core/store";
import type { Opportunity, ResultStatus, Scan, ScanResult } from "@/core/types";

export async function runScan(projectId: string): Promise<void> {
  await mutate(projectId, "run_scan", async (project) => {
    const plan = project.plan;
    const step = currentStep(project);
    if (!plan || !step) throw new Error("There is no current step to scan for.");

    const profile = await readProfile();
    if (!profile) throw new Error("Finish onboarding first.");

    const nodes = nodesForStep(project, step.id);
    const draft = await getProvider().runScan({
      brief: project.brief,
      plan,
      step,
      nodes,
      profile,
    });

    // Every approved direction for this step must be classified and must have
    // a group, even an empty one. Silence about a node is not an answer.
    const classified = new Set(draft.classifications.map((c) => c.nodeId));
    const grouped = new Set(draft.nodeResultGroups.map((g) => g.nodeId));
    for (const node of nodes) {
      if (!classified.has(node.id)) {
        throw new Error(`The scan skipped ${node.id} instead of classifying it. Try again.`);
      }
      if (!grouped.has(node.id)) {
        throw new Error(`The scan returned no group for ${node.id}. Try again.`);
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const runsToday = project.scans.filter((s) => s.id.startsWith(`scan-${today}`)).length;
    const id = scanId(today, runsToday);

    // Result ids run in one sequence across the whole scan, node-guided first
    // and wildcards last, so they are stable regardless of grouping.
    const results: ScanResult[] = [];
    let n = 0;

    for (const group of draft.nodeResultGroups) {
      const node = nodes.find((x) => x.id === group.nodeId);
      for (const result of group.results) {
        results.push({
          ...result,
          id: resultId(++n),
          scanId: id,
          stepId: step.id,
          nodeId: group.nodeId,
          nodeType: node?.nodeType ?? null,
          isWildcard: false,
          status: "proposed",
        });
      }
    }

    for (const wildcard of draft.wildcards) {
      const { whyMissedByNodes, ...rest } = wildcard;
      results.push({
        ...rest,
        id: resultId(++n),
        scanId: id,
        stepId: step.id,
        nodeId: null,
        nodeType: null,
        isWildcard: true,
        whyMissedByNodes,
        status: "proposed",
      });
    }

    const scan: Scan = {
      id,
      stepId: step.id,
      status: "proposed",
      runAt: new Date().toISOString(),
      summary: draft.summary,
      classifications: draft.classifications,
      results,
      emptyOrRejected: draft.emptyOrRejected,
      nextBestAction: draft.nextBestAction,
    };

    return { ...project, scans: [...project.scans, scan] };
  });
}

/**
 * Save, ignore, or defer one specific result.
 *
 * Saving promotes it into your opportunities. The id is built from where the
 * result came from rather than from how many opportunities already exist, so
 * promoting the same result twice is a no-op instead of a duplicate.
 */
export async function decideResult(
  projectId: string,
  scanRunId: string,
  resultRef: string,
  decision: Exclude<ResultStatus, "proposed">,
): Promise<void> {
  await mutate(projectId, "triage_results", (project) => {
    const scan = project.scans.find((s) => s.id === scanRunId);
    const result = scan?.results.find((r) => r.id === resultRef);
    if (!scan || !result) throw new Error("That result is no longer in this scan.");

    const decidedAt = new Date().toISOString();

    const scans = project.scans.map((s) =>
      s.id !== scanRunId
        ? s
        : {
            ...s,
            results: s.results.map((r) =>
              r.id === resultRef ? { ...r, status: decision, decidedAt } : r,
            ),
          },
    );

    let opportunities = project.opportunities;
    if (decision === "saved") {
      const id = opportunityId(scan.id, result.id);
      const already = opportunities.some((o) => o.id === id);
      if (!already) {
        const opportunity: Opportunity = {
          id,
          status: "active",
          promotedAt: decidedAt,
          stepId: result.stepId,
          sourceScanId: scan.id,
          sourceResultId: result.id,
          nodeId: result.nodeId,
          nodeType: result.nodeType,
          lane: result.lane,
          resultType: result.resultType,
          confidence: result.confidence,
          title: result.title,
          summary: result.summary,
          sourceLinks: result.sourceLinks,
          timing: result.timing,
          suggestedAction: result.suggestedAction,
        };
        opportunities = [...opportunities, opportunity];
      }
    }

    return { ...project, scans, opportunities };
  });
}
