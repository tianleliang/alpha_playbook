/**
 * The one door every change goes through.
 *
 * Load the project, check the rulebook says this action is legal right now,
 * apply the change, save. If the gate is closed, nothing happens - so an
 * action cannot be triggered early by a stale page, a double click, or a
 * hand-crafted request.
 *
 * The four actions that call a model get three extra guards on the way in: a
 * lock so the same goal cannot run two stages at once, a cooldown on
 * re-scanning, and a daily ceiling per person. See limits.ts.
 */

import { revalidatePath } from "next/cache";

import { type ActionId, can, latestScan } from "./flow";
import {
  DAILY_RUN_LIMIT,
  LOCK_TIMEOUT_MS,
  RESCAN_COOLDOWN_MS,
  isExpensive,
  minutesUntil,
  today,
} from "./limits";
import { readProfile, readProject, writeProfile, writeProject } from "./store";
import type { Project } from "./types";

export async function mutate(
  projectId: string,
  action: ActionId,
  change: (project: Project) => Project | Promise<Project>,
): Promise<Project> {
  const project = await readProject(projectId);
  if (!project) throw new Error("That goal no longer exists.");

  if (!can(project, action)) {
    throw new Error(
      "That step is not available yet. Refresh the page to see where the project actually is.",
    );
  }

  if (!isExpensive(action)) {
    return save(projectId, await change(project));
  }

  await checkLimits(project, action);

  // Claim the lock before the call, so a second click lands on a project that
  // already says it is busy rather than starting a parallel run.
  await writeProject({ ...project, running: { action, startedAt: new Date().toISOString() } });

  try {
    const next = await change(project);
    await countRun();
    return save(projectId, next);
  } catch (error) {
    // Release the lock, then let the real failure surface. A crashed stage
    // should not leave the goal wedged.
    await writeProject({ ...project, running: undefined }).catch(() => {});
    throw error;
  }
}

/** Always clears the lock, so it can never be saved by accident. */
async function save(projectId: string, next: Project): Promise<Project> {
  const saved = await writeProject({ ...next, running: undefined });
  revalidatePath(`/project/${projectId}`);
  revalidatePath("/");
  return saved;
}

async function checkLimits(project: Project, action: ActionId): Promise<void> {
  const running = project.running;
  if (running) {
    const age = Date.now() - new Date(running.startedAt).getTime();
    if (age < LOCK_TIMEOUT_MS) {
      throw new Error(
        "Something is already running on this goal. Wait for it to finish, or reload the page.",
      );
    }
    // Older than the timeout means the previous run died. Carry on.
  }

  if (action === "run_scan") {
    const previous = latestScan(project);
    if (previous) {
      const age = Date.now() - new Date(previous.runAt).getTime();
      if (age < RESCAN_COOLDOWN_MS) {
        throw new Error(
          `You scanned this step ${Math.round(age / 60_000)} minutes ago. Try again in ${minutesUntil(previous.runAt, RESCAN_COOLDOWN_MS)} minutes - results will not have changed much yet.`,
        );
      }
    }
  }

  const profile = await readProfile();
  const usage = profile?.usage;
  if (usage && usage.date === today() && usage.runs >= DAILY_RUN_LIMIT) {
    throw new Error(
      `That is ${DAILY_RUN_LIMIT} generations today, which is the daily limit. It resets tomorrow.`,
    );
  }
}

/** One counter per person per day. Resets by simply not matching yesterday. */
async function countRun(): Promise<void> {
  const profile = await readProfile();
  if (!profile) return;

  const day = today();
  const runs = profile.usage?.date === day ? profile.usage.runs + 1 : 1;
  await writeProfile({ ...profile, usage: { date: day, runs } });
}

/** Stamped on every approval, so an approval is a recorded event and not a checkbox. */
export function approvedNow(): { approvedBy: string; approvedAt: string } {
  return { approvedBy: "you", approvedAt: new Date().toISOString() };
}
