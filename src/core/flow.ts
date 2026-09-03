/**
 * The rulebook.
 *
 * Given a project, this file answers two questions:
 *   - What stage is it at?
 *   - What is the user allowed to do next?
 *
 * The UI never decides what to show on its own. It asks here. That is what
 * keeps the gates real instead of decorative: you cannot generate a plan
 * before the brief is approved, and you cannot scan before nodes are approved,
 * because those buttons do not exist until the state says so.
 *
 * No AI in this file, and no saving. Pure reading.
 */

import type { Opportunity, Project, Scan, Step, StepReview } from "./types";

// ---------------------------------------------------------------- stages

export type Stage =
  | "brief_review"
  | "brief_approved"
  | "plan_proposed"
  | "plan_approved"
  | "nodes_proposed"
  | "nodes_approved"
  | "scan_triage"
  | "active_work"
  | "finished_evidence"
  | "review_proposed"
  | "review_approved"
  | "complete";

export type ActionId =
  | "approve_brief"
  | "generate_plan"
  | "approve_plan"
  | "generate_nodes"
  | "approve_nodes"
  | "run_scan"
  | "triage_results"
  | "finish_opportunity"
  | "evaluate_step"
  | "decide_review"
  | "apply_review";

export interface NextAction {
  action: ActionId;
  /** What the button says. Omitted when there is nothing to press. */
  label?: string;
  /** One line telling the user why this is the thing to do now. */
  why: string;
}

// ---------------------------------------------------------------- reading helpers

export function currentStep(project: Project): Step | null {
  if (!project.plan) return null;
  return project.plan.steps.find((s) => s.status === "current") ?? null;
}

export function nextStep(project: Project): Step | null {
  if (!project.plan) return null;
  const i = project.plan.steps.findIndex((s) => s.status === "current");
  if (i === -1) return null;
  return project.plan.steps[i + 1] ?? null;
}

export function nodesForStep(project: Project, stepId: string) {
  return project.nodeSet?.nodes.filter((n) => n.stepId === stepId && n.status === "active") ?? [];
}

/** The most recent scan run against the current step, if there is one. */
export function latestScan(project: Project): Scan | null {
  const step = currentStep(project);
  if (!step) return null;
  const scans = project.scans
    .filter((s) => s.stepId === step.id)
    .sort((a, b) => b.runAt.localeCompare(a.runAt));
  return scans[0] ?? null;
}

/** Results the user has not yet saved, ignored, or deferred. */
export function untriagedResults(scan: Scan | null) {
  return scan?.results.filter((r) => r.status === "proposed") ?? [];
}

export function activeOpportunities(project: Project): Opportunity[] {
  return project.opportunities.filter((o) => o.status === "active");
}

export function finishedForCurrentStep(project: Project): Opportunity[] {
  const step = currentStep(project);
  if (!step) return [];
  return project.opportunities.filter((o) => o.status === "finished" && o.stepId === step.id);
}

/**
 * A review still waiting on the user, for the step we are actually on.
 *
 * Approved only counts as open when the verdict was "advance", because that is
 * the only one with anything left to apply. Agreeing with "keep working" ends
 * the conversation - there is no transition queued behind it, and offering one
 * would promise something that cannot happen.
 */
export function openReview(project: Project): StepReview | null {
  const step = currentStep(project);
  if (!step) return null;

  return (
    project.reviews.find(
      (r) =>
        r.fromStepId === step.id &&
        (r.status === "proposed" || (r.status === "approved" && r.decision === "advance")),
    ) ?? null
  );
}

/**
 * A stable description of exactly what evidence exists on the current step
 * right now. A review records this at the moment it was written, so we can
 * tell later whether the ground moved underneath it.
 */
export function evidenceFingerprint(project: Project): string {
  return finishedForCurrentStep(project)
    .map((o) => `${o.id}@${o.outcome?.at ?? ""}`)
    .sort()
    .join("|");
}

/**
 * A review goes stale when the thing it judged has moved on: the plan was
 * replaced, the step already advanced, or the evidence changed after the
 * review was written. Stale reviews can never be applied.
 */
export function isReviewStale(project: Project, review: StepReview): boolean {
  if (review.status === "applied" || review.status === "rejected") return true;
  if (!project.plan) return true;
  if (review.planVersion !== project.plan.version) return true;
  if (review.fromStepId !== project.currentStepId) return true;
  return review.evidenceHash !== evidenceFingerprint(project);
}

// ---------------------------------------------------------------- the state machine

export function stageOf(project: Project): Stage {
  if (project.status === "complete") return "complete";

  // Gate 1 - the brief
  if (project.brief.status !== "approved") return "brief_review";
  if (!project.plan) return "brief_approved";

  // Gate 2 - the plan
  if (project.plan.status === "proposed") return "plan_proposed";
  if (!project.nodeSet) return "plan_approved";

  // Gate 3 - the leverage nodes
  if (project.nodeSet.status === "proposed") return "nodes_proposed";

  // Gate 5 - a decided review outranks everything else, since applying it
  // changes which step we are even looking at.
  const review = openReview(project);
  if (review?.status === "approved") return "review_approved";
  if (review?.status === "proposed") return "review_proposed";

  // Gate 4 - scan results waiting to be triaged
  const scan = latestScan(project);
  if (scan && untriagedResults(scan).length > 0) return "scan_triage";

  // A step you have never scanned should offer a scan, even when work carried
  // over from the previous one. Otherwise advancing lands you on a fresh step
  // holding old tasks, with nothing pointing at the new step's opportunities.
  if (!scan) return "nodes_approved";

  // Finished work outranks work in flight. Opportunities carry across steps,
  // so you can easily have both - and once there is evidence, the useful
  // offer is "check whether this step is done", not "log something else".
  if (finishedForCurrentStep(project).length > 0) return "finished_evidence";
  if (activeOpportunities(project).length > 0) return "active_work";

  // Nothing in flight - go find some opportunities
  return "nodes_approved";
}

/**
 * The single most important thing to do right now. This is what the workspace
 * shows at the top, instead of twelve equal buttons.
 */
export function nextAction(project: Project): NextAction | null {
  const stage = stageOf(project);
  const step = currentStep(project);

  switch (stage) {
    case "brief_review":
      return {
        action: "approve_brief",
        label: "Approve brief",
        why: "Read it first. Everything after this is built on it.",
      };

    case "brief_approved":
      return {
        action: "generate_plan",
        label: "Build my plan",
        why: "Now the interesting part. This uses what you already have.",
      };

    case "plan_proposed":
      return {
        action: "approve_plan",
        label: "Approve plan",
        why: "Your call. Once you approve it, this is the path.",
      };

    case "plan_approved":
      return {
        action: "generate_nodes",
        label: "Find leverage",
        why: "Before searching, decide what is worth searching for.",
      };

    case "nodes_proposed":
      return {
        action: "approve_nodes",
        label: "Approve",
        why: "These aim the search. Worth thirty seconds.",
      };

    case "nodes_approved":
      return {
        action: "run_scan",
        label: "Go find opportunities",
        why: step
          ? `Search the outside world for things that move ${step.title} forward.`
          : "Search for opportunities relevant to your current step.",
      };

    case "scan_triage":
      return {
        action: "triage_results",
        label: "Review scan results",
        why: "Pick what you will actually do.",
      };

    case "active_work":
      // No button. You are meant to go and do these things; the app should
      // not imply that logging is the next task.
      return {
        action: "finish_opportunity",
        why: "Go and do these. Mark anything you finish and we will see where you stand.",
      };

    case "finished_evidence":
      return {
        action: "evaluate_step",
        label: "Check my progress",
        why: "You have finished something. See if that was enough.",
      };

    // Both review stages are informational here. The verdict panel below owns
    // these controls, because what you can do depends on what it decided.
    case "review_proposed":
      return {
        action: "decide_review",
        why: "There is a verdict below. Agree, or overrule it.",
      };

    case "review_approved":
      return {
        action: "apply_review",
        why: "Agreed. Apply it below and the next step begins.",
      };

    case "complete":
      return null;
  }
}

/** Whether a specific action is legal right now. Every action route checks this. */
export function can(project: Project, action: ActionId): boolean {
  const stage = stageOf(project);

  switch (action) {
    case "approve_brief":
      return stage === "brief_review";
    case "generate_plan":
      return stage === "brief_approved";
    case "approve_plan":
      return stage === "plan_proposed";
    case "generate_nodes":
      return stage === "plan_approved";
    case "approve_nodes":
      return stage === "nodes_proposed";
    case "run_scan":
      // Re-scanning is allowed once the last batch has been dealt with.
      return stage === "nodes_approved" || stage === "active_work" || stage === "finished_evidence";
    case "triage_results":
      return stage === "scan_triage";
    case "finish_opportunity":
      return activeOpportunities(project).length > 0;
    case "evaluate_step":
      return finishedForCurrentStep(project).length > 0 && !openReview(project);
    case "decide_review":
      return openReview(project)?.status === "proposed";
    case "apply_review":
      return openReview(project)?.status === "approved";
  }
}

/** Plain-English name for a stage, for the status chip in the UI. */
export const STAGE_LABEL: Record<Stage, string> = {
  brief_review: "Brief needs review",
  brief_approved: "Ready to plan",
  plan_proposed: "Plan needs review",
  plan_approved: "Ready for leverage nodes",
  nodes_proposed: "Leverage nodes need review",
  nodes_approved: "Ready to scan",
  scan_triage: "Scan results waiting",
  active_work: "In progress",
  finished_evidence: "Ready to check progress",
  review_proposed: "Review waiting",
  review_approved: "Ready to advance",
  complete: "Complete",
};
