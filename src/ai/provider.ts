/**
 * The line between the app and the AI.
 *
 * Six stages. Each one takes a specific, limited set of inputs and returns a
 * proposal. None of them save anything, and none of them decide anything -
 * deterministic code takes the proposal, checks it, assigns ids, and applies
 * it at the right gate.
 *
 * The inputs below are the whole point of this file. Notice what is missing:
 *
 *   - researchBrief does NOT receive the profile. The brief should describe
 *     what the goal IS, uncoloured by who is chasing it.
 *   - reviewStep does NOT receive the profile either. Whether a step is done
 *     is a question about evidence, not about how talented you are.
 *
 * That asymmetry is deliberate and is enforced here, by not passing the data
 * in the first place. A future provider physically cannot leak what it never
 * received.
 */

import type {
  Brief,
  GoalInput,
  LeverageNode,
  Opportunity,
  Plan,
  Profile,
  Step,
} from "@/core/types";

import type {
  BriefDraft,
  NodesDraft,
  PlanDraft,
  ProfileDraft,
  ReviewDraft,
  ScanDraft,
} from "./schemas";

export interface ProfileInput {
  resume: string;
  direction: string;
  access: string;
  constraints: string;
}

export interface PlanInput {
  brief: Brief;
  profile: Profile;
  today: string;
}

export interface NodesInput {
  brief: Brief;
  plan: Plan;
  profile: Profile;
}

export interface ScanInput {
  brief: Brief;
  plan: Plan;
  /** The current step only. Scans never range across the whole plan. */
  step: Step;
  /** Approved nodes attached to that step only. */
  nodes: LeverageNode[];
  profile: Profile;
}

export interface ReviewInput {
  brief: Brief;
  plan: Plan;
  step: Step;
  nextStepId: string | null;
  /** Only opportunities finished on this step. No profile, no other steps. */
  finished: Opportunity[];
}

export interface AiProvider {
  /** Shown in the UI so it is always obvious whether results are real. */
  readonly name: string;
  readonly isMock: boolean;

  synthesizeProfile(input: ProfileInput): Promise<ProfileDraft>;
  researchBrief(input: GoalInput): Promise<BriefDraft>;
  generatePlan(input: PlanInput): Promise<PlanDraft>;
  generateNodes(input: NodesInput): Promise<NodesDraft>;
  runScan(input: ScanInput): Promise<ScanDraft>;
  reviewStep(input: ReviewInput): Promise<ReviewDraft>;
}
