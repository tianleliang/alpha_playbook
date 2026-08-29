"use server";

/**
 * Recording what happened to something you took on.
 *
 * Two outcomes: you finished it, or you dropped it. Either way you have to
 * say something - an outcome with no notes and no impact is not evidence,
 * and the step review downstream has nothing to judge.
 */

import { mutate } from "@/core/mutate";
import type { Opportunity } from "@/core/types";

export async function closeOpportunity(
  projectId: string,
  opportunityId: string,
  action: "finish" | "deactivate",
  notes: string,
  impact: string,
): Promise<void> {
  const cleanNotes = notes.trim();
  const cleanImpact = impact.trim();

  if (!cleanNotes && !cleanImpact) {
    throw new Error("Write down what happened, or what it changed. One of the two is enough.");
  }

  await mutate(projectId, "finish_opportunity", (project) => {
    const target = project.opportunities.find((o) => o.id === opportunityId);
    if (!target) throw new Error("That opportunity is no longer on this project.");
    if (target.status !== "active") throw new Error("That one is already closed.");

    const closed: Opportunity = {
      ...target,
      status: action === "finish" ? "finished" : "inactive",
      outcome: {
        action,
        notes: cleanNotes,
        impact: cleanImpact,
        at: new Date().toISOString(),
      },
    };

    return {
      ...project,
      opportunities: project.opportunities.map((o) => (o.id === opportunityId ? closed : o)),
    };
  });
}
