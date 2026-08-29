/**
 * The shape every AI response must have.
 *
 * Nothing from an AI stage reaches your saved data without passing through
 * one of these first. If a response is missing a field or has the wrong kind
 * of value, it gets rejected here rather than half-saved.
 *
 * These are the four JSON schemas from the Obsidian system, plus the step
 * review, rewritten so the app can actually check against them.
 */

import { z } from "zod";

export const nodeTypeSchema = z.enum([
  "people",
  "communities",
  "standard_programs",
  "artifacts_side_projects",
  "direct_opportunities",
]);

export const laneSchema = z.enum(["hard", "soft"]);
export const confidenceSchema = z.enum(["high", "medium", "low"]);
export const resultTypeSchema = z.enum([
  "concrete_opportunity",
  "search_strategy",
  "artifact_action",
]);

const sourceSchema = z.object({
  title: z.string(),
  url: z.string(),
});

// ---------------------------------------------------------------- profile

/** Onboarding turns whatever the user pasted into these seven buckets. */
export const profileDraftSchema = z.object({
  currentState: z.array(z.string()),
  capabilities: z.array(z.string()),
  credibilityAndAssets: z.array(z.string()),
  relationshipsAndAccess: z.array(z.string()),
  directionAndLogic: z.array(z.string()),
  underusedLeverage: z.array(z.string()),
  unknowns: z.array(z.string()),
});

// ---------------------------------------------------------------- brief

/** Understanding the target. Never a plan - there are no steps in here. */
export const briefDraftSchema = z.object({
  title: z.string().min(1),
  objective: z.string().min(1),
  deadline: z.string(),
  success: z.string(),
  constraints: z.string(),
  targetSummary: z.string(),
  currentMechanics: z.array(z.string()),
  eligibilityAndFit: z.array(z.string()),
  selectionSignals: z.array(z.string()),
  knownUnknowns: z.array(z.string()),
  sources: z.array(sourceSchema),
});

// ---------------------------------------------------------------- plan

const stepDraftSchema = z.object({
  dateRange: z.string().min(1),
  title: z.string().min(1),
  goal: z.string(),
  asymmetricMove: z.string(),
  importantMoves: z.array(z.string()),
  /** One or two. More than two means the step should have been split. */
  completionSignals: z.array(z.string()).min(1).max(2),
  externalLeverage: z.array(z.string()),
});

export const planDraftSchema = z.object({
  strategicDiagnosis: z.array(z.string()),
  asymmetricThesis: z.array(z.string()),
  memoryBasis: z.array(
    z.object({
      fact: z.string(),
      strategicImplication: z.string(),
      sourceLinks: z.array(z.string()),
    }),
  ),
  keyGaps: z.array(z.string()),
  timelineSteps: z.array(stepDraftSchema).min(1),
  risks: z.array(z.string()),
  notNow: z.array(z.string()),
  firstMove: z.string(),
});

// ---------------------------------------------------------------- leverage nodes

export const nodesDraftSchema = z.object({
  /** One entry per plan step, in plan order. An empty node list is fine. */
  stepNodes: z.array(
    z.object({
      stepId: z.string(),
      nodes: z.array(
        z.object({
          nodeType: nodeTypeSchema,
          phrase: z.string().min(1),
        }),
      ),
    }),
  ),
});

// ---------------------------------------------------------------- scan

const resultDraftSchema = z.object({
  lane: laneSchema,
  resultType: resultTypeSchema,
  title: z.string().min(1),
  summary: z.string(),
  sourceLinks: z.array(z.string()),
  timing: z.string(),
  suggestedAction: z.string(),
  confidence: confidenceSchema,
});

export const scanDraftSchema = z.object({
  summary: z.string(),
  /** Every node gets sorted into exactly one lane. */
  classifications: z.array(
    z.object({
      nodeId: z.string(),
      lane: laneSchema,
      reason: z.string(),
    }),
  ),
  /** One group per node, even when the group is empty. */
  nodeResultGroups: z.array(
    z.object({
      nodeId: z.string(),
      results: z.array(resultDraftSchema),
    }),
  ),
  /** Things the nodes missed. Hard cap of two, on purpose. */
  wildcards: z.array(resultDraftSchema.extend({ whyMissedByNodes: z.string() })).max(2),
  emptyOrRejected: z.array(z.object({ nodeId: z.string(), reason: z.string() })),
  nextBestAction: z.string(),
});

// ---------------------------------------------------------------- step review

export const reviewDraftSchema = z.object({
  decision: z.enum(["advance", "stay", "needs_more_evidence", "revise_plan"]),
  reasoning: z.string(),
  evidenceSummary: z.string(),
  nextStepId: z.string(),
});

// ---------------------------------------------------------------- types

export type ProfileDraft = z.infer<typeof profileDraftSchema>;
export type BriefDraft = z.infer<typeof briefDraftSchema>;
export type PlanDraft = z.infer<typeof planDraftSchema>;
export type NodesDraft = z.infer<typeof nodesDraftSchema>;
export type ScanDraft = z.infer<typeof scanDraftSchema>;
export type ReviewDraft = z.infer<typeof reviewDraftSchema>;
