/**
 * Proves what happens after a step advances, and that the spend guards fire.
 *
 *   npm run check:advance
 *
 * Pure state machine and pure policy - no database, no AI, no network.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { nextAction, stageOf } from "../src/core/flow.ts";
import { DAILY_RUN_LIMIT, EXPENSIVE, RESCAN_COOLDOWN_MS, isExpensive } from "../src/core/limits.ts";
import type { Project } from "../src/core/types.ts";

const base = JSON.parse(
  readFileSync(join(process.cwd(), "src", "demo", "project.json"), "utf8"),
) as Project;

let failures = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (ok) console.log(`  pass  ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` - ${detail}` : ""}`);
  }
};

/** The project as it looks the moment an advance has been applied. */
function advanced({ carryOver }: { carryOver: boolean }): Project {
  const p = structuredClone(base);
  const steps = p.plan!.steps;

  steps[0] = { ...steps[0], status: "complete", completedAt: new Date().toISOString() };
  steps[1] = { ...steps[1], status: "current" };
  p.currentStepId = steps[1].id;

  // Scans belong to the step they were run for, so the new step has none.
  p.scans = p.scans.map((s) => ({ ...s, status: "reviewed" as const }));
  p.reviews = [];

  p.opportunities = carryOver
    ? p.opportunities.map((o) => ({ ...o, status: "active" as const, outcome: undefined }))
    : p.opportunities.map((o) => ({ ...o, status: "finished" as const }));

  return p;
}

console.log("\nAfter advancing a step\n");

for (const carryOver of [false, true]) {
  const p = advanced({ carryOver });
  const stage = stageOf(p);
  const action = nextAction(p);

  check(
    `${carryOver ? "with" : "without"} carried-over work: offers a scan of the new step`,
    stage === "nodes_approved" && action?.action === "run_scan",
    `got stage ${stage}, action ${action?.action}`,
  );
  check(
    `${carryOver ? "with" : "without"} carried-over work: the button is pressable`,
    Boolean(action?.label),
    "no label means no button",
  );
}

// Once the new step has been scanned, the offer changes to triage.
const scanned = advanced({ carryOver: true });
scanned.scans = [
  ...scanned.scans,
  {
    ...base.scans[0],
    id: "scan-new",
    stepId: scanned.currentStepId!,
    status: "proposed",
    // A fresh scan arrives undecided; that is what makes it something to triage.
    results: base.scans[0].results.map((r) => ({
      ...r,
      stepId: scanned.currentStepId!,
      status: "proposed" as const,
    })),
  },
];
check("once the new step is scanned, results are what it asks about", stageOf(scanned) === "scan_triage");

console.log("\nSpend guards\n");

check(
  "only the four model stages are treated as expensive",
  EXPENSIVE.length === 4 &&
    ["generate_plan", "generate_nodes", "run_scan", "evaluate_step"].every(isExpensive),
);
check("approving costs nothing", !isExpensive("approve_plan") && !isExpensive("approve_brief"));
check("triage and logging cost nothing", !isExpensive("triage_results") && !isExpensive("finish_opportunity"));
check("re-scan cooldown is a real window", RESCAN_COOLDOWN_MS >= 5 * 60_000);
check("there is a daily ceiling", DAILY_RUN_LIMIT > 0 && DAILY_RUN_LIMIT <= 100);

console.log(failures === 0 ? "\nAll cases behaved as expected.\n" : `\n${failures} failed.\n`);
process.exit(failures === 0 ? 0 : 1);
