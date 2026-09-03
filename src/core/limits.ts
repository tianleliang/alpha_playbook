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

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function minutesUntil(from: string, windowMs: number): number {
  const remaining = windowMs - (Date.now() - new Date(from).getTime());
  return Math.max(1, Math.ceil(remaining / 60_000));
}
