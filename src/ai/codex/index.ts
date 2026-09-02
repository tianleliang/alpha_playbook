/**
 * The real thing.
 *
 * Six stages, each one call. The whole file is the table from ARCHITECTURE.md
 * made executable - look at what each stage assembles into its context and you
 * can see exactly what that stage is allowed to know.
 *
 * Two stages are shown less on purpose:
 *   - researchBrief never receives the profile
 *   - reviewStep never receives the profile
 *
 * Web search is on for exactly two stages: brief research and scanning.
 */

import type {
  AiProvider,
  NodesInput,
  PlanInput,
  ProfileInput,
  ReviewInput,
  ScanInput,
} from "../provider";
import {
  BRIEF_PROMPT,
  NODES_PROMPT,
  PLAN_PROMPT,
  PROFILE_PROMPT,
  REVIEW_PROMPT,
  SCAN_PROMPT,
} from "../prompts";
import {
  briefDraftSchema,
  nodesDraftSchema,
  planDraftSchema,
  profileDraftSchema,
  reviewDraftSchema,
  scanDraftSchema,
} from "../schemas";
import {
  blocks,
  briefText,
  finishedText,
  nodesText,
  planText,
  profileText,
  stepIndexText,
  stepText,
  today,
} from "../serialize";
import type { GoalInput } from "@/core/types";

import { runCodex } from "./run";

const MINUTES = 60_000;

export const codexProvider: AiProvider = {
  name: "Codex",
  isMock: false,

  // -------------------------------------------------------------- profile

  synthesizeProfile(input: ProfileInput) {
    return runCodex(
      PROFILE_PROMPT,
      blocks([
        ["BACKGROUND AS SUPPLIED", input.resume],
        ["WHAT THEY ARE TRYING TO BECOME OR BUILD", input.direction],
        ["WHO THEY ALREADY KNOW", input.access],
        ["WHAT LIMITS THEM", input.constraints],
      ]),
      profileDraftSchema,
      { label: "Building your profile", timeoutMs: 4 * MINUTES },
    );
  },

  // -------------------------------------------------------------- brief

  /** Web search on. No profile - this describes the target, not the person. */
  researchBrief(goal: GoalInput) {
    return runCodex(
      BRIEF_PROMPT,
      blocks([
        ["CURRENT DATE", today()],
        ["OBJECTIVE", goal.objective],
        ["DEADLINE OR HORIZON", goal.deadline || "Not stated."],
        ["DEFINITION OF SUCCESS", goal.success],
        ["CONSTRAINTS", goal.constraints || "None stated."],
      ]),
      briefDraftSchema,
      { label: "Researching the target", search: true, timeoutMs: 8 * MINUTES },
    );
  },

  // -------------------------------------------------------------- plan

  /** No web search. Planning happens from the brief and the person, not the internet. */
  generatePlan({ brief, profile, today: date }: PlanInput) {
    return runCodex(
      PLAN_PROMPT,
      blocks([
        ["CURRENT DATE", date],
        ["APPROVED GOAL BRIEF", briefText(brief)],
        ["USER PROFILE", profileText(profile)],
      ]),
      planDraftSchema,
      { label: "Building your plan", timeoutMs: 10 * MINUTES },
    );
  },

  // -------------------------------------------------------------- directions

  generateNodes({ brief, plan, profile }: NodesInput) {
    return runCodex(
      NODES_PROMPT,
      blocks([
        ["CURRENT DATE", today()],
        ["APPROVED GOAL BRIEF", briefText(brief)],
        ["CURRENT PLAN", planText(plan)],
        [
          "PLAN STEPS - RETURN ONE ENTRY FOR EACH, IN THIS ORDER, USING THESE EXACT IDS",
          stepIndexText(plan.steps),
        ],
        ["USER PROFILE", profileText(profile)],
      ]),
      nodesDraftSchema,
      { label: "Finding leverage directions", timeoutMs: 8 * MINUTES },
    );
  },

  // -------------------------------------------------------------- scan

  /** Web search on. Current step only - never the whole plan's worth of directions. */
  runScan({ brief, plan, step, nodes, profile }: ScanInput) {
    return runCodex(
      SCAN_PROMPT,
      blocks([
        ["CURRENT DATE", today()],
        ["APPROVED GOAL BRIEF", briefText(brief)],
        ["CURRENT PLAN", planText(plan)],
        ["CURRENT TIMELINE STEP - SCAN FOR THIS STEP ONLY", stepText(step)],
        [
          "APPROVED LEVERAGE DIRECTIONS FOR THIS STEP - CLASSIFY AND GROUP EVERY ONE",
          nodesText(nodes),
        ],
        ["USER PROFILE", profileText(profile)],
      ]),
      scanDraftSchema,
      { label: "Scanning for opportunities", search: true, timeoutMs: 15 * MINUTES },
    );
  },

  // -------------------------------------------------------------- review

  /** No profile, no other steps, no scans. Evidence only. */
  reviewStep({ brief, plan, step, nextStepId, finished }: ReviewInput) {
    return runCodex(
      REVIEW_PROMPT,
      blocks([
        ["CURRENT DATE", today()],
        ["GOAL BRIEF", briefText(brief)],
        ["FULL PLAN", planText(plan)],
        ["CURRENT STEP UNDER REVIEW", stepText(step)],
        ["NEXT STEP ID", nextStepId ?? "There is no next step. This is the final step."],
        ["FINISHED WORK ON THIS STEP", finishedText(finished)],
      ]),
      reviewDraftSchema,
      { label: "Checking your progress", timeoutMs: 5 * MINUTES },
    );
  },
};
