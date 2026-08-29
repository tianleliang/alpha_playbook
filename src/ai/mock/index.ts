/**
 * Stand-in AI.
 *
 * Returns believable, correctly-shaped responses without calling anything.
 * It exists so the whole loop can be built and walked before a single real
 * model call is made - which means any bug you hit is a bug in the app, not
 * in a prompt.
 *
 * Responses are lightly shaped by what you actually typed, so the demo does
 * not feel disconnected from your goal. They are still fake, and the UI says
 * so wherever they appear.
 *
 * Everything here is validated against the real schemas on the way out, so
 * the fixtures cannot drift from what a live provider will have to produce.
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
  type BriefDraft,
  type NodesDraft,
  type PlanDraft,
  type ProfileDraft,
  type ReviewDraft,
  type ScanDraft,
  briefDraftSchema,
  nodesDraftSchema,
  planDraftSchema,
  profileDraftSchema,
  reviewDraftSchema,
  scanDraftSchema,
} from "../schemas";
import type { GoalInput, NodeType } from "@/core/types";

/** A beat of delay so generation feels like it is doing something. */
const think = (ms = 550) => new Promise((r) => setTimeout(r, ms));

/** Split pasted text into usable lines, dropping bullets and blank rows. */
function lines(text: string, limit: number): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((l) => l.length > 2)
    .slice(0, limit);
}

function firstSentence(text: string, max = 64): string {
  const clean = text.trim().replace(/\s+/g, " ");
  const cut = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  return cut.length > max ? `${cut.slice(0, max).trimEnd()}...` : cut;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "September-November 2026" style labels, walking forward from today. */
function monthRange(offsetMonths: number, span: number, from = new Date()): string {
  const start = new Date(from.getFullYear(), from.getMonth() + offsetMonths, 1);
  const end = new Date(from.getFullYear(), from.getMonth() + offsetMonths + span - 1, 1);
  const startLabel = MONTHS[start.getMonth()];
  const endLabel = MONTHS[end.getMonth()];
  if (span === 1) return `${startLabel} ${start.getFullYear()}`;
  if (start.getFullYear() === end.getFullYear()) {
    return `${startLabel}-${endLabel} ${end.getFullYear()}`;
  }
  return `${startLabel} ${start.getFullYear()}-${endLabel} ${end.getFullYear()}`;
}

export const mockProvider: AiProvider = {
  name: "Demo data",
  isMock: true,

  // -------------------------------------------------------------- profile

  async synthesizeProfile(input: ProfileInput): Promise<ProfileDraft> {
    await think(900);
    const resumeLines = lines(input.resume, 12);
    const draft: ProfileDraft = {
      currentState: [
        input.direction ? firstSentence(input.direction, 120) : "Direction not yet stated.",
        resumeLines[0] ?? "Background pending a fuller resume.",
      ].filter(Boolean),
      capabilities: resumeLines.slice(0, 4),
      credibilityAndAssets: resumeLines.slice(4, 7),
      relationshipsAndAccess: lines(input.access, 4),
      directionAndLogic: lines(input.direction, 3),
      underusedLeverage: [
        "Work already finished but never made public or reusable.",
        "People who would help if asked with something concrete in hand.",
      ],
      unknowns: [
        ...lines(input.constraints, 3),
        "Built from demo synthesis - re-run once a real provider is connected.",
      ],
    };
    return profileDraftSchema.parse(draft);
  },

  // -------------------------------------------------------------- brief

  async researchBrief(goal: GoalInput): Promise<BriefDraft> {
    await think(1200);
    const title = firstSentence(goal.objective, 60);
    const draft: BriefDraft = {
      title,
      objective: goal.objective.trim(),
      deadline: goal.deadline.trim() || "No deadline stated.",
      success: goal.success.trim(),
      constraints: goal.constraints.trim() || "None stated.",
      targetSummary: `Demo research summary for "${title}". A live provider would explain here what this target actually is, who runs it, and how it currently works, with every claim traced to a source.`,
      currentMechanics: [
        "How the target currently accepts, selects, or awards - filled in by live research.",
        "Cycle timing and whether entry is rolling or deadline-driven.",
      ],
      eligibilityAndFit: [
        "Who is eligible on paper.",
        "Who actually tends to get through, marked clearly as inference rather than official criteria.",
      ],
      selectionSignals: [
        "The strongest observable signal the target appears to reward.",
        "A second signal that separates near-misses from selections.",
      ],
      knownUnknowns: [
        "Anything unresolved that would materially change the plan.",
        "Demo mode: no live research was performed for this brief.",
      ],
      sources: [
        { title: "Placeholder source (demo mode)", url: "https://example.com/target" },
      ],
    };
    return briefDraftSchema.parse(draft);
  },

  // -------------------------------------------------------------- plan

  async generatePlan({ brief, profile }: PlanInput): Promise<PlanDraft> {
    await think(1600);
    const asset = profile.capabilities[0] ?? "your existing work";
    const contact = profile.relationshipsAndAccess[0] ?? "someone already in your network";
    const target = firstSentence(brief.title, 40);

    const draft: PlanDraft = {
      strategicDiagnosis: [
        `The gap is not effort, it is visible proof that you can do the thing ${target} selects for.`,
        "You have relevant work, but it is private, so it counts for nothing at selection time.",
        "Time spent broadening will cost more than time spent making one thing undeniable.",
      ],
      asymmetricThesis: [
        `Convert ${asset} into a public artifact instead of starting something new.`,
        "Use warm introductions only after that artifact exists, so the ask is specific.",
        "Let one artifact serve as proof, outreach hook, and application evidence at once.",
      ],
      memoryBasis: [
        {
          fact: asset,
          strategicImplication: "Already built, so it is the cheapest route to visible proof.",
          sourceLinks: [],
        },
        {
          fact: contact,
          strategicImplication: "Worth a specific ask once there is something concrete to react to.",
          sourceLinks: [],
        },
      ],
      keyGaps: [
        "Nothing public that a stranger could evaluate in two minutes.",
        "No outside signal that the direction is right.",
      ],
      timelineSteps: [
        {
          dateRange: monthRange(0, 1),
          title: `Turn ${firstSentence(asset, 32)} into something someone else can look at`,
          goal: "Get one piece of existing work out of your drafts and in front of people.",
          asymmetricMove: `Ship what you already have rather than starting fresh - ${firstSentence(asset, 40)} is most of the way there.`,
          importantMoves: [
            "Pick the single strongest thing you have already done.",
            "Cut it down to what a stranger can understand quickly.",
            "Publish it somewhere with a real link.",
          ],
          completionSignals: ["A public link exists that you would send to a stranger."],
          externalLeverage: ["Places where work like this normally gets posted and read."],
        },
        {
          dateRange: monthRange(1, 2),
          title: "Get real reactions from people who would know",
          goal: "Find out whether the direction holds up outside your own head.",
          asymmetricMove: `Now that a link exists, ${firstSentence(contact, 40)} can be asked something specific rather than for coffee.`,
          importantMoves: [
            "Send it to three people whose judgment you trust.",
            "Ask one sharp question, not for general feedback.",
            "Write down what surprised you.",
          ],
          completionSignals: [
            "Three substantive replies received.",
            "One thing you believed turned out to be wrong.",
          ],
          externalLeverage: [
            "Communities where this kind of work gets discussed seriously.",
            "People with direct experience of the target.",
          ],
        },
        {
          dateRange: monthRange(3, 2),
          title: "Build the evidence the target actually selects on",
          goal: `Close the specific gap between where you are and what ${target} rewards.`,
          asymmetricMove:
            "Aim at the one signal the brief identified rather than improving everything at once.",
          importantMoves: [
            "Pick the single selection signal you are weakest on.",
            "Do the smallest thing that produces real evidence of it.",
          ],
          completionSignals: ["Concrete evidence exists for the weakest selection signal."],
          externalLeverage: [
            "Programs, grants, or competitions that produce this evidence as a by-product.",
          ],
        },
        {
          dateRange: monthRange(5, 1),
          title: "Convert",
          goal: "Apply, pitch, or ask, with the evidence assembled.",
          asymmetricMove:
            "Go in with proof and warm references already in place rather than a cold application.",
          importantMoves: ["Assemble everything into the required format.", "Submit early."],
          completionSignals: ["Submitted, with evidence and references attached."],
          externalLeverage: [],
        },
      ],
      risks: [
        "Polishing the artifact forever instead of showing it to anyone.",
        "Treating encouraging replies as validation when they are politeness.",
      ],
      notNow: [
        "Starting a second project before the first one is public.",
        "Broad networking with nothing concrete to show.",
        "Optimising anything the target does not select on.",
      ],
      firstMove: "Choose the one piece of existing work you would be least embarrassed to publish, and give yourself this week to publish it.",
    };
    return planDraftSchema.parse(draft);
  },

  // -------------------------------------------------------------- nodes

  async generateNodes({ plan }: NodesInput): Promise<NodesDraft> {
    await think(1100);
    const byIndex: Array<Array<{ nodeType: NodeType; phrase: string }>> = [
      [
        { nodeType: "artifacts_side_projects", phrase: "Public formats where work like this is normally published and actually read" },
        { nodeType: "communities", phrase: "Small groups that give real critique on early work rather than encouragement" },
      ],
      [
        { nodeType: "people", phrase: "People one step ahead on this exact path who answer specific questions" },
        { nodeType: "communities", phrase: "Recurring circles where the target's insiders show up informally" },
        { nodeType: "direct_opportunities", phrase: "Open office hours, AMAs, or feedback sessions with relevant people" },
      ],
      [
        { nodeType: "standard_programs", phrase: "Application-based programs, grants, or competitions that produce visible evidence" },
        { nodeType: "direct_opportunities", phrase: "Near-term deadlines that would force the evidence to exist" },
      ],
      // Final step is a conversion step. Nothing external to search for, and
      // an empty list is a valid answer.
      [],
    ];

    const draft: NodesDraft = {
      stepNodes: plan.steps.map((step, i) => ({
        stepId: step.id,
        nodes: byIndex[i] ?? [],
      })),
    };
    return nodesDraftSchema.parse(draft);
  },

  // -------------------------------------------------------------- scan

  async runScan({ step, nodes }: ScanInput): Promise<ScanDraft> {
    await think(1900);

    // Nodes that point at published, applied-to things go to the hard lane;
    // people and community searches go to the soft lane.
    const hardTypes: NodeType[] = ["standard_programs", "direct_opportunities"];
    const laneFor = (t: NodeType): "hard" | "soft" => (hardTypes.includes(t) ? "hard" : "soft");

    const classifications = nodes.map((n) => ({
      nodeId: n.id,
      lane: laneFor(n.nodeType),
      reason:
        laneFor(n.nodeType) === "hard"
          ? "Likely to have real pages with deadlines and an entry route."
          : "Better answered with a way of looking than with a single link.",
    }));

    // Only the first two nodes return anything. Empty groups are normal and
    // the UI has to handle them, so the demo produces some.
    const groups = nodes.map((n, i) => {
      if (i > 1) return { nodeId: n.id, results: [] };
      const hard = laneFor(n.nodeType) === "hard";
      return {
        nodeId: n.id,
        results: [
          hard
            ? {
                lane: "hard" as const,
                resultType: "concrete_opportunity" as const,
                title: "Open call with a deadline this cycle (demo)",
                summary: `A real scan would put a specific, currently-open opportunity here, matched to ${step.title} and sourced from its official page.`,
                sourceLinks: ["https://example.com/program"],
                timing: "Applications close in about six weeks.",
                suggestedAction: "Read the eligibility page and check whether this cycle is still open.",
                confidence: "medium" as const,
              }
            : {
                lane: "soft" as const,
                resultType: "search_strategy" as const,
                title: "How to find the right people for this step (demo)",
                summary:
                  "A real scan would give you an ideal profile, where to look, exact search phrases, the first message to send, and the signal that means it is worth pursuing.",
                sourceLinks: [],
                timing: "Worth two hours this week.",
                suggestedAction: "Draft the first message before you go looking, so the ask is ready.",
                confidence: "medium" as const,
              },
        ],
      };
    });

    const draft: ScanDraft = {
      summary: `Demo scan for ${step.id} - ${step.title}. ${nodes.length} leverage direction${nodes.length === 1 ? "" : "s"} classified.`,
      classifications,
      nodeResultGroups: groups,
      wildcards: [
        {
          lane: "hard",
          resultType: "artifact_action",
          title: "Something the directions missed (demo wildcard)",
          summary:
            "Wildcards are capped at two and only exist for genuinely strong things your leverage directions would not have found.",
          sourceLinks: [],
          timing: "No deadline pressure.",
          suggestedAction: "Decide whether this is worth a slot before saving it.",
          confidence: "low",
          whyMissedByNodes: "Sits outside every approved direction for this step.",
        },
      ],
      emptyOrRejected: nodes.slice(2).map((n) => ({
        nodeId: n.id,
        reason: "Nothing strong enough to be worth your attention this cycle.",
      })),
      nextBestAction: "Save the one result you would genuinely act on this week, and ignore the rest.",
    };
    return scanDraftSchema.parse(draft);
  },

  // -------------------------------------------------------------- step review

  async reviewStep({ step, nextStepId, finished }: ReviewInput): Promise<ReviewDraft> {
    await think(1300);
    const enough = finished.length >= 1;
    const draft: ReviewDraft = {
      decision: enough ? "advance" : "needs_more_evidence",
      reasoning: enough
        ? `The signals for ${step.id} look substantially met. A live review would be more sceptical than this one and would weigh whether the finished work genuinely satisfies the completion signal, rather than counting it.`
        : "Nothing has been finished on this step yet, so there is no evidence to judge.",
      evidenceSummary: enough
        ? finished.map((o) => `${o.title}: ${o.outcome?.impact || "no impact recorded"}`).join(" | ")
        : "No finished opportunities on this step.",
      nextStepId: enough ? (nextStepId ?? "") : "",
    };
    return reviewDraftSchema.parse(draft);
  },
};
