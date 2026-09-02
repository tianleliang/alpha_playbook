/**
 * Turning saved objects back into text an AI stage can read.
 *
 * Each stage gets labelled blocks, the same shape the Obsidian scripts used:
 *
 *   === APPROVED GOAL BRIEF ===
 *   ...
 *
 * Keeping this in one file means it is obvious at a glance what any stage is
 * being shown, which matters because two stages are deliberately shown less.
 */

import type { Brief, LeverageNode, Opportunity, Plan, Profile, Step } from "@/core/types";

/** Joins labelled sections into one prompt context. */
export function blocks(sections: Array<[string, string]>): string {
  return sections
    .filter(([, body]) => body.trim().length > 0)
    .map(([label, body]) => `=== ${label} ===\n\n${body.trim()}`)
    .join("\n\n");
}

const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

export function briefText(brief: Brief): string {
  return [
    `Title: ${brief.title}`,
    `Objective: ${brief.objective}`,
    `Deadline: ${brief.deadline}`,
    `Success means: ${brief.success}`,
    `Constraints: ${brief.constraints}`,
    ``,
    `What this target is:`,
    brief.targetSummary,
    ``,
    `How it currently works:`,
    list(brief.currentMechanics),
    ``,
    `Eligibility and fit:`,
    list(brief.eligibilityAndFit),
    ``,
    `What it appears to reward:`,
    list(brief.selectionSignals),
    ``,
    `Known unknowns:`,
    list(brief.knownUnknowns),
    ``,
    `Sources:`,
    brief.sources.map((s) => `- ${s.title}: ${s.url}`).join("\n"),
  ].join("\n");
}

export function profileText(profile: Profile): string {
  const section = (label: string, items: string[]) =>
    items.length > 0 ? `${label}:\n${list(items)}` : "";

  return [
    section("Current state", profile.currentState),
    section("Capabilities", profile.capabilities),
    section("Credibility and assets", profile.credibilityAndAssets),
    section("Relationships and access", profile.relationshipsAndAccess),
    section("Direction and personal logic", profile.directionAndLogic),
    section("Underused leverage", profile.underusedLeverage),
    section("Unknowns", profile.unknowns),
    ``,
    `Raw background as supplied by the user:`,
    profile.raw.resume,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function stepText(step: Step): string {
  return [
    `${step.id} | ${step.dateRange} | ${step.title} [${step.status}]`,
    `Goal: ${step.goal}`,
    `Asymmetric move: ${step.asymmetricMove}`,
    step.importantMoves.length ? `Moves:\n${list(step.importantMoves)}` : "",
    `Done when:\n${list(step.completionSignals)}`,
    step.externalLeverage.length ? `External leverage:\n${list(step.externalLeverage)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function planText(plan: Plan): string {
  return [
    `Plan ${plan.id} (${plan.status})`,
    ``,
    `Diagnosis:`,
    list(plan.strategicDiagnosis),
    ``,
    `Thesis:`,
    list(plan.asymmetricThesis),
    ``,
    `Key gaps:`,
    list(plan.keyGaps),
    ``,
    `Timeline:`,
    plan.steps.map(stepText).join("\n\n"),
    ``,
    `Risks:`,
    list(plan.risks),
    ``,
    `Deliberately not doing:`,
    list(plan.notNow),
    ``,
    `First move: ${plan.firstMove}`,
  ].join("\n");
}

/** Directions are given as a flat id-tagged list so the model can echo ids back exactly. */
export function nodesText(nodes: LeverageNode[]): string {
  if (nodes.length === 0) return "No leverage directions are attached to this step.";
  return nodes.map((n) => `- ${n.id} | ${n.nodeType} | ${n.phrase}`).join("\n");
}

/** Steps are listed bare for node generation, which only needs ids, titles and dates. */
export function stepIndexText(steps: Step[]): string {
  return steps.map((s) => `- ${s.id} | ${s.dateRange} | ${s.title} | ${s.goal}`).join("\n");
}

export function finishedText(finished: Opportunity[]): string {
  if (finished.length === 0) return "Nothing has been finished on this step.";
  return finished
    .map((o) =>
      [
        `${o.id}: ${o.title}`,
        `What it was: ${o.summary}`,
        `What happened: ${o.outcome?.notes || "not recorded"}`,
        `What it changed: ${o.outcome?.impact || "not recorded"}`,
      ].join("\n"),
    )
    .join("\n\n");
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
