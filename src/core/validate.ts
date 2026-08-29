/**
 * The health check.
 *
 * In the Obsidian system this had to rebuild an index by parsing tags out of
 * Markdown, because the relationships only existed as text. Here the
 * relationships are the data structure, so there is no index to rebuild -
 * only relationships to verify.
 *
 * It reports; it never repairs. Silently rewriting your data to make a warning
 * go away is how you lose work.
 */

import { evidenceFingerprint } from "./flow";
import type { Project } from "./types";

export interface Warning {
  where: string;
  message: string;
}

export function checkProject(project: Project): Warning[] {
  const warnings: Warning[] = [];
  const add = (where: string, message: string) => warnings.push({ where, message });

  const plan = project.plan;
  const stepIds = new Set(plan?.steps.map((s) => s.id) ?? []);
  const nodeIds = new Set(project.nodeSet?.nodes.map((n) => n.id) ?? []);
  const scanIds = new Set(project.scans.map((s) => s.id));

  // -- ids are unique within their parent
  duplicates(plan?.steps.map((s) => s.id) ?? []).forEach((id) =>
    add(plan?.id ?? "plan", `Two steps share the id ${id}.`),
  );
  duplicates(project.nodeSet?.nodes.map((n) => n.id) ?? []).forEach((id) =>
    add("directions", `Two directions share the id ${id}.`),
  );
  duplicates(project.scans.map((s) => s.id)).forEach((id) =>
    add("scans", `Two scans share the id ${id}.`),
  );
  duplicates(project.opportunities.map((o) => o.id)).forEach((id) =>
    add("opportunities", `Two opportunities share the id ${id}.`),
  );

  // -- exactly one current step while the project is running
  if (plan && project.status !== "complete") {
    const current = plan.steps.filter((s) => s.status === "current");
    if (current.length === 0) add(plan.id, "No step is marked as current.");
    if (current.length > 1) {
      add(plan.id, `${current.length} steps are marked current at once.`);
    }
    if (current[0] && current[0].id !== project.currentStepId) {
      add(plan.id, `The project points at ${project.currentStepId}, but ${current[0].id} is current.`);
    }
  }

  // -- every direction belongs to a step that exists
  for (const node of project.nodeSet?.nodes ?? []) {
    if (!stepIds.has(node.stepId)) {
      add(node.id, `Points at ${node.stepId}, which is not in the plan.`);
    }
  }
  if (project.nodeSet && plan && project.nodeSet.planVersion !== plan.version) {
    add("directions", `Built for plan v${project.nodeSet.planVersion}, but the plan is v${plan.version}.`);
  }

  // -- every result belongs to its scan, its step, and its direction
  for (const scan of project.scans) {
    if (!stepIds.has(scan.stepId)) add(scan.id, `Ran against ${scan.stepId}, which is not in the plan.`);
    duplicates(scan.results.map((r) => r.id)).forEach((id) =>
      add(scan.id, `Two results share the id ${id}.`),
    );
    for (const result of scan.results) {
      if (result.scanId !== scan.id) add(result.id, `Claims to belong to ${result.scanId}.`);
      if (result.nodeId && !nodeIds.has(result.nodeId)) {
        add(result.id, `Came from ${result.nodeId}, which no longer exists.`);
      }
      if (result.isWildcard && result.nodeId) {
        add(result.id, "Marked as a wildcard but attached to a direction.");
      }
    }
    const wildcards = scan.results.filter((r) => r.isWildcard).length;
    if (wildcards > 2) add(scan.id, `${wildcards} wildcards - the limit is two.`);
  }

  // -- every opportunity can be traced back to the result it came from
  for (const opportunity of project.opportunities) {
    const scan = project.scans.find((s) => s.id === opportunity.sourceScanId);
    if (!scanIds.has(opportunity.sourceScanId)) {
      add(opportunity.id, `Came from ${opportunity.sourceScanId}, which no longer exists.`);
    } else if (!scan?.results.some((r) => r.id === opportunity.sourceResultId)) {
      add(opportunity.id, `Came from ${opportunity.sourceResultId}, which is not in that scan.`);
    }
    if (!stepIds.has(opportunity.stepId)) {
      add(opportunity.id, `Attached to ${opportunity.stepId}, which is not in the plan.`);
    }
    if (opportunity.status !== "active" && !opportunity.outcome) {
      add(opportunity.id, "Closed without recording what happened.");
    }
  }

  // -- reviews still describe the project they were written about
  const fingerprint = evidenceFingerprint(project);
  for (const review of project.reviews) {
    if (!stepIds.has(review.fromStepId)) {
      add(review.id, `Reviews ${review.fromStepId}, which is not in the plan.`);
    }
    if (review.status === "proposed" || review.status === "approved") {
      if (plan && review.planVersion !== plan.version) {
        add(review.id, `Written against plan v${review.planVersion}, but the plan is v${plan.version}.`);
      }
      if (review.evidenceHash !== fingerprint) {
        add(review.id, "The evidence changed after this was written. It can no longer be applied.");
      }
    }
    if (review.status === "applied" && !review.appliedAt) {
      add(review.id, "Marked as applied but has no date.");
    }
  }

  return warnings;
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes];
}
