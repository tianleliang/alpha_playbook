/**
 * Proves the health check actually catches things.
 *
 *   npm run check
 *
 * Reads your real saved project, confirms it is clean, then deliberately
 * breaks copies of it in five different ways and confirms each break is
 * caught. A checker that never fires is not a checker.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { checkProject } from "../src/core/validate.ts";
import type { Project } from "../src/core/types.ts";

// Goals live in Postgres now, so point this at an exported project file:
//   npm run check -- path/to/project.json
const target = process.argv[2] ?? join(process.cwd(), "src", "demo", "project.json");
if (!existsSync(target)) {
  console.error(`No project file at ${target}. Pass one: npm run check -- path/to/project.json`);
  process.exit(1);
}

const project = JSON.parse(readFileSync(target, "utf8")) as Project;
const copy = () => structuredClone(project);

let failures = 0;

function expect(label: string, mutated: Project, shouldCatch: string) {
  const warnings = checkProject(mutated);
  const caught = warnings.some((w) => w.message.includes(shouldCatch));
  if (caught) {
    console.log(`  pass  ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label} - expected a warning containing "${shouldCatch}"`);
    warnings.forEach((w) => console.log(`          got: ${w.where} ${w.message}`));
  }
}

console.log(`\nChecking ${project.title}\n`);

// 1. The real thing should be clean.
const clean = checkProject(project);
if (clean.length === 0) {
  console.log("  pass  the saved project has no warnings");
} else {
  failures += 1;
  console.log("  FAIL  the saved project has warnings:");
  clean.forEach((w) => console.log(`          ${w.where}: ${w.message}`));
}

// 2. A direction pointing at a step that does not exist.
const orphanNode = copy();
if (orphanNode.nodeSet) orphanNode.nodeSet.nodes[0].stepId = "step-99";
expect("orphaned leverage direction", orphanNode, "not in the plan");

// 3. An opportunity whose source scan was deleted.
const brokenLineage = copy();
brokenLineage.opportunities[0]!.sourceScanId = "scan-1999-01-01";
expect("opportunity with a missing source scan", brokenLineage, "no longer exists");

// 4. Two steps claiming to be current at once.
const twoCurrent = copy();
if (twoCurrent.plan) twoCurrent.plan.steps[2].status = "current";
expect("two steps marked current", twoCurrent, "marked current at once");

// 5. A review whose evidence changed after it was written.
const staleReview = copy();
staleReview.reviews.push({
  ...staleReview.reviews[0]!,
  id: "review-plan-v1-step-02-injected",
  status: "proposed",
  fromStepId: staleReview.currentStepId ?? "step-02",
  evidenceHash: "no-longer-matches",
  appliedAt: undefined,
});
expect("review bound to evidence that changed", staleReview, "evidence changed");

// 6. Duplicate opportunity ids.
const duped = copy();
duped.opportunities.push({ ...duped.opportunities[0]! });
expect("duplicate opportunity id", duped, "share the id");

console.log(failures === 0 ? "\nAll checks behaved as expected.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
