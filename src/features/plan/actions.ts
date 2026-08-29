"use server";

/**
 * Plan generation and approval.
 *
 * The AI proposes steps. This file decides what they are called, which one you
 * are on, and when the plan becomes real. That split is the whole design: the
 * model never assigns an id and never sets a status.
 */

import { getProvider } from "@/ai";
import { hashOf, planId, stepId } from "@/core/ids";
import { approvedNow, mutate } from "@/core/mutate";
import { readProfile } from "@/core/store";
import type { Plan, Step } from "@/core/types";

export async function generatePlan(projectId: string): Promise<void> {
  await mutate(projectId, "generate_plan", async (project) => {
    const profile = await readProfile();
    if (!profile) throw new Error("Finish onboarding before generating a plan.");

    const draft = await getProvider().generatePlan({
      brief: project.brief,
      profile,
      today: new Date().toISOString().slice(0, 10),
    });

    // Ids and statuses are assigned here, in order, every time.
    const steps: Step[] = draft.timelineSteps.map((step, i) => ({
      ...step,
      id: stepId(i + 1),
      status: i === 0 ? "current" : "pending",
    }));

    const version = (project.plan?.version ?? 0) + 1;
    const plan: Plan = {
      id: planId(version),
      version,
      status: "proposed",
      createdAt: new Date().toISOString(),
      strategicDiagnosis: draft.strategicDiagnosis,
      asymmetricThesis: draft.asymmetricThesis,
      memoryBasis: draft.memoryBasis,
      keyGaps: draft.keyGaps,
      steps,
      risks: draft.risks,
      notNow: draft.notNow,
      firstMove: draft.firstMove,
      // Remembers which version of you this plan was built from.
      profileHash: hashOf(profile),
    };

    return { ...project, plan, currentStepId: steps[0].id };
  });
}

export async function approvePlan(projectId: string): Promise<void> {
  await mutate(projectId, "approve_plan", (project) => ({
    ...project,
    status: "active",
    plan: project.plan
      ? { ...project.plan, status: "approved", approval: approvedNow() }
      : project.plan,
  }));
}
