"use server";

import { approvedNow, mutate } from "@/core/mutate";

/**
 * Approving the brief is a real state change, not a tick. It records who and
 * when, and it is the only thing that unlocks plan generation.
 */
export async function approveBrief(projectId: string): Promise<void> {
  await mutate(projectId, "approve_brief", (project) => ({
    ...project,
    brief: { ...project.brief, status: "approved", approval: approvedNow() },
  }));
}
