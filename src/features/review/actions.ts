"use server";

/**
 * Step reviews, and the one deterministic transition in the whole app.
 *
 * evaluateStep asks the AI a narrow question: is this step done? It sees the
 * brief, the plan, the current step, and the finished work on that step. It
 * does not see your profile - whether a step is finished is a question about
 * evidence, not about how capable you are.
 *
 * applyReview involves no AI at all. It moves the project.
 */

import { getProvider } from "@/ai";
import { currentStep, evidenceFingerprint, finishedForCurrentStep, isReviewStale, nextStep, openReview } from "@/core/flow";
import { reviewId } from "@/core/ids";
import { approvedNow, mutate } from "@/core/mutate";
import type { Project, Step, StepReview } from "@/core/types";

export async function evaluateStep(projectId: string): Promise<void> {
  await mutate(projectId, "evaluate_step", async (project) => {
    const plan = project.plan;
    const step = currentStep(project);
    if (!plan || !step) throw new Error("There is no current step to review.");

    const upcoming = nextStep(project);
    const finished = finishedForCurrentStep(project);

    const draft = await getProvider().reviewStep({
      brief: project.brief,
      plan,
      step,
      nextStepId: upcoming?.id ?? null,
      finished,
    });

    const today = new Date().toISOString().slice(0, 10);
    const review: StepReview = {
      id: reviewId(plan.version, step.id, today),
      status: "proposed",
      createdAt: new Date().toISOString(),
      planVersion: plan.version,
      fromStepId: step.id,
      toStepId:
        draft.decision === "advance" ? (draft.nextStepId || upcoming?.id || null) : null,
      // Pinned to the evidence that existed at this moment.
      evidenceHash: evidenceFingerprint(project),
      decision: draft.decision,
      reasoning: draft.reasoning,
      evidenceSummary: draft.evidenceSummary,
    };

    // Replace any earlier review for this same step rather than stacking them.
    const reviews = project.reviews.filter((r) => r.id !== review.id);
    return { ...project, reviews: [...reviews, review] };
  });
}

export async function decideReview(projectId: string, accept: boolean): Promise<void> {
  await mutate(projectId, "decide_review", (project) => {
    const review = openReview(project);
    if (!review) throw new Error("There is no review waiting.");

    return {
      ...project,
      reviews: project.reviews.map((r) =>
        r.id !== review.id
          ? r
          : accept
            ? { ...r, status: "approved" as const, approval: approvedNow() }
            : { ...r, status: "rejected" as const },
      ),
    };
  });
}

/**
 * The transition. No AI, no judgment - it reads an approved review and moves
 * the project exactly one step, or completes it.
 */
export async function applyReview(projectId: string): Promise<void> {
  await mutate(projectId, "apply_review", (project) => {
    const review = openReview(project);
    if (!review || review.status !== "approved") {
      throw new Error("There is no approved review to apply.");
    }
    if (isReviewStale(project, review)) {
      throw new Error(
        "This review no longer matches the project - the plan or the evidence changed since it was written. Run a fresh one.",
      );
    }
    if (review.decision !== "advance") {
      throw new Error("Only an advance recommendation moves the project.");
    }

    const plan = project.plan;
    if (!plan) throw new Error("There is no plan to advance.");

    const at = new Date().toISOString();
    const fromIndex = plan.steps.findIndex((s) => s.id === review.fromStepId);
    const upcoming = plan.steps[fromIndex + 1] ?? null;

    const steps: Step[] = plan.steps.map((step, i) => {
      if (i === fromIndex) return { ...step, status: "complete" as const, completedAt: at };
      if (upcoming && i === fromIndex + 1) return { ...step, status: "current" as const };
      return step;
    });

    return {
      ...project,
      plan: { ...plan, steps },
      currentStepId: upcoming?.id ?? null,
      status: upcoming ? "active" : "complete",
      // The scan that fed this step is now history, not a live inbox.
      scans: project.scans.map((s) =>
        s.stepId === review.fromStepId ? { ...s, status: "reviewed" as const } : s,
      ),
      reviews: project.reviews.map((r) =>
        r.id === review.id ? { ...r, status: "applied" as const, appliedAt: at } : r,
      ),
    } satisfies Project;
  });
}
