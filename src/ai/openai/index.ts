/**
 * The deployable provider.
 *
 * Same six stages as the Codex one, same prompts, same schemas - but over HTTP
 * instead of a local binary, so it works on a server. This is what runs in
 * production; the Codex CLI stays useful for local work without spending API
 * credit.
 *
 * Web search is on for exactly two stages: brief research and scanning.
 */

import type { z } from "zod";

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
import { jsonSchemaFor } from "../codex/run";
import type { GoalInput } from "@/core/types";

const ENDPOINT = "https://api.openai.com/v1/responses";
const MINUTES = 60_000;

function model(): string {
  return process.env.PLAYBOOK_OPENAI_MODEL?.trim() || "gpt-5";
}

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("No OPENAI_API_KEY is set. Add it to .env.local and restart the server.");
  }
  return key;
}

interface CallOptions {
  label: string;
  search?: boolean;
  timeoutMs?: number;
  /**
   * gpt-5 thinks before it answers, and that thinking is most of the wall
   * clock. "low" is roughly three times faster and is fine for stages whose
   * quality comes from the sources or the rules rather than from deliberation.
   * The plan is the exception - that one is the product.
   */
  effort?: "low" | "medium" | "high";
}

/** Worth one retry: the provider having a bad moment, not a bad request. */
function isTransient(status: number): boolean {
  return status === 429 || status >= 500;
}

function friendlyError(label: string, status: number, body: string): string {
  const detail = (() => {
    try {
      return JSON.parse(body)?.error?.message ?? "";
    } catch {
      return "";
    }
  })();

  if (status === 401) return `${label} could not authenticate. Check OPENAI_API_KEY in .env.local.`;
  if (status === 429) {
    return /quota|billing/i.test(detail)
      ? `${label} could not run: this API key is out of quota.`
      : `${label} hit a rate limit. Wait a moment and try again.`;
  }
  if (status >= 500) return `${label} could not run: OpenAI is having trouble. Try again shortly.`;
  return `${label} failed${detail ? `: ${detail.slice(0, 300)}` : ` (${status}).`}`;
}

async function call<T>(
  prompt: string,
  context: string,
  schema: z.ZodType<T>,
  options: CallOptions,
): Promise<T> {
  const body = {
    model: model(),
    input: [
      { role: "developer", content: prompt },
      { role: "user", content: context },
    ],
    reasoning: { effort: options.effort ?? "low" },
    ...(options.search ? { tools: [{ type: "web_search" }] } : {}),
    text: {
      format: {
        type: "json_schema",
        name: "playbook_stage",
        strict: true,
        schema: jsonSchemaFor(schema),
      },
    },
  };

  const raw = await request(body, options);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new Error(`${options.label} returned something that was not valid JSON.`);
  }

  // Same belt-and-braces as the Codex path: the API honours the schema, but
  // nothing reaches your data without passing our own check too.
  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 4)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`${options.label} came back in the wrong shape - ${issues}`);
  }
  return result.data;
}

async function request(body: unknown, options: CallOptions, attempt = 1): Promise<string> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
    // Next wraps global fetch to add caching, and that wrapper drops long-held
    // connections well before our own timeout. These stages run for minutes,
    // so opt out of the wrapper entirely.
    cache: "no-store",
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(options.timeoutMs ?? 10 * MINUTES),
  } as RequestInit).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      /abort|timeout/i.test(message)
        ? `${options.label} took too long and was stopped.`
        : `${options.label} could not reach OpenAI: ${message}`,
    );
  });

  if (!response.ok) {
    const text = await response.text();
    if (isTransient(response.status) && attempt === 1) {
      await new Promise((r) => setTimeout(r, 4000));
      return request(body, options, 2);
    }
    throw new Error(friendlyError(options.label, response.status, text));
  }

  return extractText(await response.json(), options.label);
}

/**
 * A response is a list of items. Search calls and reasoning show up alongside
 * the answer, so pull the text out of the message rather than assuming
 * position.
 */
function extractText(payload: unknown, label: string): string {
  const output = (payload as { output?: unknown[] })?.output;
  if (!Array.isArray(output)) throw new Error(`${label} returned an unexpected response.`);

  const chunks: string[] = [];
  for (const item of output) {
    const entry = item as { type?: string; content?: unknown[] };
    if (entry.type !== "message" || !Array.isArray(entry.content)) continue;
    for (const part of entry.content) {
      const piece = part as { type?: string; text?: string };
      if (piece.type === "output_text" && typeof piece.text === "string") chunks.push(piece.text);
    }
  }

  const text = chunks.join("").trim();
  if (!text) {
    const incomplete = (payload as { status?: string })?.status;
    throw new Error(
      incomplete && incomplete !== "completed"
        ? `${label} did not finish (${incomplete}). Try again.`
        : `${label} returned nothing.`,
    );
  }
  return text;
}

export const openaiProvider: AiProvider = {
  name: "OpenAI",
  isMock: false,

  synthesizeProfile(input: ProfileInput) {
    return call(
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

  /** Web search on. No profile - this describes the target, not the person. */
  researchBrief(goal: GoalInput) {
    return call(
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

  generatePlan({ brief, profile, today: date }: PlanInput) {
    return call(
      PLAN_PROMPT,
      blocks([
        ["CURRENT DATE", date],
        ["APPROVED GOAL BRIEF", briefText(brief)],
        ["USER PROFILE", profileText(profile)],
      ]),
      planDraftSchema,
      { label: "Building your plan", effort: "medium", timeoutMs: 10 * MINUTES },
    );
  },

  generateNodes({ brief, plan, profile }: NodesInput) {
    return call(
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

  /** Web search on. Current step only. */
  runScan({ brief, plan, step, nodes, profile }: ScanInput) {
    return call(
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

  /** No profile, no other steps, no scans. Evidence only. */
  reviewStep({ brief, plan, step, nextStepId, finished }: ReviewInput) {
    return call(
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
