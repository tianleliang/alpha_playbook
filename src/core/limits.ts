/**
 * What stops this costing money it should not.
 *
 * Only four actions call a model, and each one is a real web search or a long
 * reasoning call. Everything else in the app is free. So the limits only need
 * to guard those four, and they live here rather than being scattered through
 * the features.
 *
 * Worth knowing what is NOT a risk: the AI stages are server actions, not
 * routes. There is no URL you can type that runs one, and no GET request that
 * spends anything. Pages only ever read.
 */

import type { ActionId } from "./flow";

/** The only actions that cost anything. */
export const EXPENSIVE: ActionId[] = [
  "generate_plan",
  "generate_nodes",
  "run_scan",
  "evaluate_step",
];

export function isExpensive(action: ActionId): boolean {
  return EXPENSIVE.includes(action);
}

/**
 * How long a stage may hold the lock before we assume it died. Longer than the
 * slowest call (a scan, about fifteen minutes at worst) so a slow run is never
 * mistaken for a crashed one.
 */
export const LOCK_TIMEOUT_MS = 16 * 60_000;

/**
 * Re-scanning the same step is allowed - results go stale, deadlines pass -
 * but not twice in a row out of impatience. A scan takes a couple of minutes
 * and costs the most of any call.
 */
export const RESCAN_COOLDOWN_MS = 10 * 60_000;

/** Per person, per day, across every goal. Generous for real use; a ceiling on runaway loops. */
export const DAILY_RUN_LIMIT = 40;

export function today(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function minutesUntil(from: string, windowMs: number, now = Date.now()): number {
  const remaining = windowMs - (now - new Date(from).getTime());
  return Math.max(1, Math.ceil(remaining / 60_000));
}

/**
 * The whole policy, as one pure decision.
 *
 * Returns the reason to refuse, or null to go ahead. Kept separate from the
 * saving so it can be tested exhaustively without a database, a request, or a
 * model - which matters, because a limit that fires when it should not is a
 * worse bug than no limit at all.
 */
export function refusalReason(
  action: ActionId,
  state: {
    running?: { action: string; startedAt: string };
    lastScanAt?: string;
    /** Whether the last scan produced anything the user kept. */
    lastScanKeptAnything?: boolean;
    usage?: { date: string; runs: number };
  },
  now = Date.now(),
): string | null {
  if (!isExpensive(action)) return null;

  if (state.running) {
    const age = now - new Date(state.running.startedAt).getTime();
    if (age < LOCK_TIMEOUT_MS) {
      return "Something is already running on this goal. Wait for it to finish, or reload the page.";
    }
    // Older than the timeout means that run died. Let this one through.
  }

  if (action === "run_scan" && state.lastScanAt) {
    const age = now - new Date(state.lastScanAt).getTime();
    // A scan you kept nothing from is worth retrying straight away; the
    // cooldown exists to stop impatience, not to trap you with bad results.
    if (age < RESCAN_COOLDOWN_MS && state.lastScanKeptAnything !== false) {
      return `You scanned this step ${Math.max(1, Math.round(age / 60_000))} minutes ago. Try again in ${minutesUntil(state.lastScanAt, RESCAN_COOLDOWN_MS, now)} minutes - the results will not have changed much yet.`;
    }
  }

  if (state.usage && state.usage.date === today(new Date(now)) && state.usage.runs >= DAILY_RUN_LIMIT) {
    return `That is ${DAILY_RUN_LIMIT} generations today, which is the daily limit. It resets tomorrow.`;
  }

  return null;
}
