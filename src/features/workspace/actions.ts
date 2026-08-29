"use server";

/**
 * One entry point for the "do the next thing" button.
 *
 * The rulebook has already decided which action is available, so the button
 * just says which one it is. Each action still re-checks its own gate inside
 * mutate(), so this dispatcher cannot be used to skip ahead.
 */

import type { ActionId } from "@/core/flow";
import { approveBrief } from "@/features/brief/actions";
import { approveNodes, generateNodes } from "@/features/nodes/actions";
import { approvePlan, generatePlan } from "@/features/plan/actions";
import { evaluateStep } from "@/features/review/actions";
import { runScan } from "@/features/scan/actions";

export async function runStageAction(projectId: string, action: ActionId): Promise<void> {
  switch (action) {
    case "approve_brief":
      return approveBrief(projectId);
    case "generate_plan":
      return generatePlan(projectId);
    case "approve_plan":
      return approvePlan(projectId);
    case "generate_nodes":
      return generateNodes(projectId);
    case "approve_nodes":
      return approveNodes(projectId);
    case "run_scan":
      return runScan(projectId);
    case "evaluate_step":
      return evaluateStep(projectId);
    default:
      // The remaining stages need input from you, so they live in their own
      // panels rather than behind this button.
      throw new Error("Use the panel below for this step.");
  }
}
