/**
 * The one door every change goes through.
 *
 * Load the project, check the rulebook says this action is legal right now,
 * apply the change, save. If the gate is closed, nothing happens - so an
 * action cannot be triggered early by a stale page, a double click, or a
 * hand-crafted request.
 */

import { revalidatePath } from "next/cache";

import { type ActionId, can } from "./flow";
import { readProject, writeProject } from "./store";
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

  const saved = await writeProject(await change(project));
  revalidatePath(`/project/${projectId}`);
  revalidatePath("/");
  return saved;
}

/** Stamped on every approval, so an approval is a recorded event and not a checkbox. */
export function approvedNow(): { approvedBy: string; approvedAt: string } {
  return { approvedBy: "you", approvedAt: new Date().toISOString() };
}
