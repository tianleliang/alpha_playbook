/**
 * Proves the step review flow behaves.
 *
 *   npm run check:review
 *
 * This is the path that broke: agreeing with a "not yet" verdict used to mark
 * it approved, which then offered a transition that always threw. These cases
 * pin the behaviour so it cannot regress.
 *
 * Pure state machine - no database, no AI, no network.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { nextAction, openReview, stageOf } from "../src/core/flow.ts";
import type { Project, ReviewDecision, StepReview } from "../src/core/types.ts";

const base = JSON.parse(
  readFileSync(join(process.cwd(), "src", "demo", "project.json"), "utf8"),
) as Project;

let failures = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) console.log(`  pass  ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

/** A project sitting on a fresh review with the given verdict. */
function withReview(decision: ReviewDecision, status: StepReview["status"]): Project {
  const project = structuredClone(base);
  const step = project.plan!.steps.find((s) => s.status === "current")!;
  const review: StepReview = {
    id: "review-test",
    status,
    createdAt: new Date().toISOString(),
    planVersion: project.plan!.version,
    fromStepId: step.id,
    toStepId: decision === "advance" ? "step-02" : null,
    evidenceHash: "",
    decision,
    reasoning: "test",
    evidenceSummary: "test",
  };
  // Match the fingerprint so the review is not considered stale.
  const finished = project.opportunities
    .filter((o) => o.status === "finished" && o.stepId === step.id)
    .map((o) => `${o.id}@${o.outcome?.at ?? ""}`)
    .sort()
    .join("|");
  review.evidenceHash = finished;
  project.reviews = [review];
  return project;
}

console.log("\nStep review flow\n");

// A waiting review is what the app talks about, whatever the verdict.
for (const decision of ["advance", "stay", "needs_more_evidence", "revise_plan"] as const) {
  const project = withReview(decision, "proposed");
  check(`${decision}: stage is review_proposed`, stageOf(project) === "review_proposed");
}

// The bug: buttons the dispatcher cannot run.
const proposed = withReview("needs_more_evidence", "proposed");
check(
  "a waiting review offers no button, only the panel",
  nextAction(proposed)?.label === undefined,
  `got label ${JSON.stringify(nextAction(proposed)?.label)}`,
);

const approved = withReview("advance", "approved");
check(
  "an approved review offers no button either",
  nextAction(approved)?.label === undefined,
  `got label ${JSON.stringify(nextAction(approved)?.label)}`,
);
check("an approved advance is stage review_approved", stageOf(approved) === "review_approved");

// The combination the old code could produce: approved, but not an advance.
// There is nothing to apply behind it, so it must not read as open.
const strandedApproval = withReview("needs_more_evidence", "approved");
check(
  "an approved non-advance verdict is finished business, not a pending transition",
  openReview(strandedApproval) === null,
  `openReview returned a ${openReview(strandedApproval)?.status} review`,
);
check(
  "and it returns you to your work rather than offering a move",
  ["active_work", "finished_evidence", "nodes_approved"].includes(stageOf(strandedApproval)),
  `got stage ${stageOf(strandedApproval)}`,
);

// A settled review gets out of the way rather than blocking the workspace.
for (const status of ["applied", "rejected"] as const) {
  const project = withReview("needs_more_evidence", status);
  check(`a ${status} review no longer counts as open`, openReview(project) === null);
  check(
    `a ${status} review returns you to your work`,
    ["active_work", "finished_evidence", "nodes_approved"].includes(stageOf(project)),
    `got ${stageOf(project)}`,
  );
}

console.log(failures === 0 ? "\nAll cases behaved as expected.\n" : `\n${failures} failed.\n`);
process.exit(failures === 0 ? 0 : 1);
