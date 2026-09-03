/**
 * Proves the spend guards refuse the right things and, more importantly, do
 * not refuse the wrong ones.
 *
 *   npm run check:limits
 *
 * A limit that fires when it should not is worse than no limit: it blocks
 * someone mid-flow with no way round it. So most of these cases are about
 * what must still be allowed.
 */

import {
  DAILY_RUN_LIMIT,
  LOCK_TIMEOUT_MS,
  RESCAN_COOLDOWN_MS,
  refusalReason,
} from "../src/core/limits.ts";

const NOW = new Date("2026-09-03T12:00:00.000Z").getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MINUTE = 60_000;

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) console.log(`  pass  ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

const allowed = (...args: Parameters<typeof refusalReason>) => refusalReason(...args) === null;

console.log("\nWhat must still be allowed\n");

check("a first run, nothing in the way", allowed("generate_plan", {}, NOW));

check(
  "free actions are never touched",
  ["approve_brief", "approve_plan", "triage_results", "finish_opportunity", "apply_review"].every(
    (a) =>
      allowed(
        a as Parameters<typeof refusalReason>[0],
        { running: { action: "run_scan", startedAt: ago(MINUTE) }, usage: { date: "2026-09-03", runs: 999 } },
        NOW,
      ),
  ),
  "approving or triaging during a run, or over quota, must still work",
);

check(
  "a crashed run does not wedge the goal",
  allowed("run_scan", { running: { action: "run_scan", startedAt: ago(LOCK_TIMEOUT_MS + MINUTE) } }, NOW),
);

check(
  "the lock outlives the slowest call",
  LOCK_TIMEOUT_MS > 15 * MINUTE,
  "a slow scan would otherwise be mistaken for a dead one",
);

check(
  "a scan that turned up nothing you kept can be retried at once",
  allowed("run_scan", { lastScanAt: ago(MINUTE), lastScanKeptAnything: false }, NOW),
  "otherwise 'none of these help' traps you for ten minutes",
);

check(
  "yesterday's usage does not count against today",
  allowed("run_scan", { usage: { date: "2026-09-02", runs: DAILY_RUN_LIMIT + 50 } }, NOW),
);

check(
  "being one under the ceiling is fine",
  allowed("generate_plan", { usage: { date: "2026-09-03", runs: DAILY_RUN_LIMIT - 1 } }, NOW),
);

check(
  "the cooldown has expired",
  allowed("run_scan", { lastScanAt: ago(RESCAN_COOLDOWN_MS + MINUTE), lastScanKeptAnything: true }, NOW),
);

check(
  "a previous scan on another step never blocks a fresh one",
  allowed("run_scan", {}, NOW),
  "a new step has no lastScanAt at all",
);

console.log("\nWhat must be refused\n");

check(
  "a second click while a stage is running",
  !allowed("run_scan", { running: { action: "run_scan", startedAt: ago(MINUTE) } }, NOW),
);

check(
  "re-scanning a step you just scanned and kept things from",
  !allowed("run_scan", { lastScanAt: ago(2 * MINUTE), lastScanKeptAnything: true }, NOW),
);

check(
  "going over the daily ceiling",
  !allowed("generate_plan", { usage: { date: "2026-09-03", runs: DAILY_RUN_LIMIT } }, NOW),
);

console.log("\nWhat it says when it refuses\n");

const busy = refusalReason("run_scan", { running: { action: "run_scan", startedAt: ago(MINUTE) } }, NOW);
check("the busy message says what to do", Boolean(busy?.includes("reload")), busy ?? "");

const cooling = refusalReason(
  "run_scan",
  { lastScanAt: ago(3 * MINUTE), lastScanKeptAnything: true },
  NOW,
);
check("the cooldown message says how long", Boolean(cooling?.match(/\d+ minutes/)), cooling ?? "");

const capped = refusalReason("run_scan", { usage: { date: "2026-09-03", runs: DAILY_RUN_LIMIT } }, NOW);
check("the ceiling message says when it lifts", Boolean(capped?.includes("tomorrow")), capped ?? "");

console.log(failures === 0 ? "\nAll cases behaved as expected.\n" : `\n${failures} failed.\n`);
process.exit(failures === 0 ? 0 : 1);
