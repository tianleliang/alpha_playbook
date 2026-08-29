"use server";

/**
 * Goal intake.
 *
 * Four fields in, one researched brief out. Note what does NOT happen here:
 * the profile is never passed to the research stage, and no plan is produced.
 * This stage only works out what the goal actually is.
 */

import { redirect } from "next/navigation";

import { getProvider } from "@/ai";
import { projectId } from "@/core/ids";
import { createProject } from "@/core/store";
import type { GoalInput, Project } from "@/core/types";

export async function createGoal(formData: FormData): Promise<void> {
  const goal: GoalInput = {
    objective: String(formData.get("objective") ?? "").trim(),
    deadline: String(formData.get("deadline") ?? "").trim(),
    success: String(formData.get("success") ?? "").trim(),
    constraints: String(formData.get("constraints") ?? "").trim(),
  };

  if (!goal.objective) throw new Error("Say what you are trying to do.");
  if (!goal.success) throw new Error("Say how you would know you had succeeded.");

  const draft = await getProvider().researchBrief(goal);
  const id = projectId(draft.title, goal);
  const now = new Date().toISOString();

  const project: Project = {
    id,
    title: draft.title,
    status: "planning",
    createdAt: now,
    updatedAt: now,
    goalInput: goal,
    brief: { status: "review", ...draft },
    plan: null,
    nodeSet: null,
    scans: [],
    opportunities: [],
    reviews: [],
    currentStepId: null,
  };

  // Throws if this exact goal already exists rather than overwriting it.
  await createProject(project);
  redirect(`/project/${id}`);
}
