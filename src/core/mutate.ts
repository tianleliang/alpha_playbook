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
import { isExpensive, refusalReason } from "./limits";
import { readProfile, readProject, writeProfile, writeProject } from "./store";
import { today } from "./limits";
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

/** Gathers the state the policy needs, then asks it. The decision itself lives in limits.ts. */
async function checkLimits(project: Project, action: ActionId): Promise<void> {
  const previous = latestScan(project);
  const profile = await readProfile();

  const reason = refusalReason(action, {
    running: project.running,
    lastScanAt: previous?.runAt,
    lastScanKeptAnything: previous
      ? previous.results.some((r) => r.status === "saved")
      : undefined,
    usage: profile?.usage,
  });

  if (reason) throw new Error(reason);
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
