/**
 * The nouns. Every object Playbook knows about.
 *
 * This is the code version of the Alpha Object Contract. If something isn't
 * described here, it doesn't exist in the system.
 */

// ---------------------------------------------------------------- shared

/** "2026-08-28" */
export type ISODate = string;
/** Full timestamp, "2026-08-28T21:04:11.000Z" */
export type Timestamp = string;

/** Every approval records who and when. Not just a checkbox. */
export interface Approval {
  approvedBy: string;
  approvedAt: Timestamp;
}

export interface Source {
  title: string;
  url: string;
}

// ---------------------------------------------------------------- profile

/**
 * The user's personal context. Fills the same slot the Personal Leverage Map
 * fills in the Obsidian system, so the real map can replace it later without
 * anything else changing.
 *
 * Consumed by: plan generation, node generation, opportunity scan.
 * Deliberately NOT consumed by: goal intake, step review.
 */
export interface Profile {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  /** Exactly what the user typed during onboarding, kept verbatim. */
  raw: {
    resume: string;
    direction: string;
    access: string;
    constraints: string;
  };

  currentState: string[];
  capabilities: string[];
  credibilityAndAssets: string[];
  relationshipsAndAccess: string[];
  directionAndLogic: string[];
  underusedLeverage: string[];
  unknowns: string[];
}

// ---------------------------------------------------------------- goal + brief

/** The only four things the user supplies. Nothing is inferred here. */
export interface GoalInput {
  objective: string;
  deadline: string;
  success: string;
  constraints: string;
}

export type BriefStatus = "review" | "approved";

/**
 * The researched understanding of the target. Explains what the goal IS
 * and how it works. Never contains a plan.
 */
export interface Brief {
  status: BriefStatus;
  approval?: Approval;

  title: string;
  objective: string;
  deadline: string;
  success: string;
  constraints: string;

  targetSummary: string;
  currentMechanics: string[];
  eligibilityAndFit: string[];
  selectionSignals: string[];
  knownUnknowns: string[];
  sources: Source[];
}

// ---------------------------------------------------------------- plan + steps

export type StepStatus = "current" | "pending" | "complete" | "skipped";

/** The primary progress object. One per phase of the plan. */
export interface Step {
  /** "step-01" */
  id: string;
  status: StepStatus;

  /** "September-November 2026" */
  dateRange: string;
  title: string;
  goal: string;
  /** The one sentence naming the specific advantage this step uses. */
  asymmetricMove: string;
  importantMoves: string[];
  /** One or two observable signals. Not a checklist. */
  completionSignals: string[];
  externalLeverage: string[];

  completedAt?: Timestamp;
}

export type PlanStatus = "proposed" | "approved" | "archived";

export interface MemoryBasis {
  fact: string;
  strategicImplication: string;
  sourceLinks: string[];
}

export interface Plan {
  /** "plan-v1" */
  id: string;
  version: number;
  status: PlanStatus;
  approval?: Approval;
  createdAt: Timestamp;

  strategicDiagnosis: string[];
  asymmetricThesis: string[];
  memoryBasis: MemoryBasis[];
  keyGaps: string[];
  steps: Step[];
  risks: string[];
  /** Attractive things to deliberately NOT do. */
  notNow: string[];
  firstMove: string;

  /** Which profile this plan was built from, so we can tell when it is stale. */
  profileHash: string;
}

// ---------------------------------------------------------------- leverage nodes

export type NodeType =
  | "people"
  | "communities"
  | "standard_programs"
  | "artifacts_side_projects"
  | "direct_opportunities";

export type NodeStatus = "active" | "retired";

/**
 * A search direction, not an opportunity. Tells a future scan what KIND of
 * external thing to look for. Middle-sharp: specific enough to avoid generic
 * results, open enough to discover several real things.
 */
export interface LeverageNode {
  /** "node-01-01" - step number, then node number within that step. */
  id: string;
  stepId: string;
  nodeType: NodeType;
  phrase: string;
  status: NodeStatus;
}

export type NodeSetStatus = "proposed" | "approved" | "archived";

export interface NodeSet {
  id: string;
  planVersion: number;
  status: NodeSetStatus;
  approval?: Approval;
  createdAt: Timestamp;
  nodes: LeverageNode[];
}

// ---------------------------------------------------------------- scans

export type Lane = "hard" | "soft";
export type Confidence = "high" | "medium" | "low";
export type ResultType = "concrete_opportunity" | "search_strategy" | "artifact_action";
export type ResultStatus = "proposed" | "saved" | "ignored" | "deferred";

/** Why each node was routed to the hard or soft lane. */
export interface NodeClassification {
  nodeId: string;
  lane: Lane;
  reason: string;
}

export interface ScanResult {
  /** "result-01" */
  id: string;
  scanId: string;
  stepId: string;

  /** null for wildcards, which by definition have no originating node. */
  nodeId: string | null;
  nodeType: NodeType | null;

  lane: Lane;
  resultType: ResultType;
  title: string;
  summary: string;
  sourceLinks: string[];
  timing: string;
  suggestedAction: string;
  confidence: Confidence;

  isWildcard: boolean;
  whyMissedByNodes?: string;

  status: ResultStatus;
  decidedAt?: Timestamp;
}

export type ScanStatus = "proposed" | "reviewed";

/** One scan run. Immutable once written - triage changes result status only. */
export interface Scan {
  /** "scan-2026-08-28" */
  id: string;
  stepId: string;
  status: ScanStatus;
  runAt: Timestamp;

  summary: string;
  classifications: NodeClassification[];
  results: ScanResult[];
  emptyOrRejected: { nodeId: string; reason: string }[];
  nextBestAction: string;
}

// ---------------------------------------------------------------- opportunities

export type OpportunityStatus = "active" | "inactive" | "finished";

/** A scan result the user chose to pursue. Keeps full lineage back to its source. */
export interface Opportunity {
  /** "opp-2026-08-28-result-01" - derived from source, not from ordering. */
  id: string;
  status: OpportunityStatus;
  promotedAt: Timestamp;

  // lineage
  stepId: string;
  sourceScanId: string;
  sourceResultId: string;
  nodeId: string | null;
  nodeType: NodeType | null;

  // preserved detail
  lane: Lane;
  resultType: ResultType;
  confidence: Confidence;
  title: string;
  summary: string;
  sourceLinks: string[];
  timing: string;
  suggestedAction: string;

  /** Set when the user finishes or deactivates it. */
  outcome?: {
    action: "finish" | "deactivate";
    notes: string;
    impact: string;
    at: Timestamp;
  };
}

// ---------------------------------------------------------------- step review

export type ReviewDecision = "advance" | "stay" | "needs_more_evidence" | "revise_plan";
export type ReviewStatus = "proposed" | "approved" | "applied" | "rejected" | "stale";

/**
 * A conservative judgment on whether the current step is done.
 * Always a proposal. Never moves the project by itself.
 */
export interface StepReview {
  id: string;
  status: ReviewStatus;
  createdAt: Timestamp;

  /** Bound to exactly what was reviewed, so a stale review cannot be applied. */
  planVersion: number;
  fromStepId: string;
  toStepId: string | null;
  evidenceHash: string;

  decision: ReviewDecision;
  reasoning: string;
  evidenceSummary: string;

  approval?: Approval;
  appliedAt?: Timestamp;
}

// ---------------------------------------------------------------- project

export type ProjectStatus = "planning" | "active" | "paused" | "complete" | "archived";

/** One goal, and everything that has happened to it. The whole file. */
export interface Project {
  /** "goal-become-competitive-for-z-fellows-a1b2c3d4" */
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  goalInput: GoalInput;
  brief: Brief;

  plan: Plan | null;
  nodeSet: NodeSet | null;
  scans: Scan[];
  opportunities: Opportunity[];
  reviews: StepReview[];

  /** Mirrors whichever step has status "current". Kept for fast lookup. */
  currentStepId: string | null;
}
