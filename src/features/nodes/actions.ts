"use server";

/**
 * Leverage nodes: what each step should go looking for.
 *
 * The AI returns one list per step, in plan order. Empty lists are valid and
 * expected - a conversion step usually has nothing external to search for.
 * This file checks the coverage and assigns the ids.
 */

import { getProvider } from "@/ai";
import { nodeId } from "@/core/ids";
import { approvedNow, mutate } from "@/core/mutate";
import { readProfile } from "@/core/store";
import type { LeverageNode, NodeSet } from "@/core/types";

export async function generateNodes(projectId: string): Promise<void> {
  await mutate(projectId, "generate_nodes", async (project) => {
    const plan = project.plan;
    if (!plan) throw new Error("There is no plan to attach leverage directions to.");

    const profile = await readProfile();
    if (!profile) throw new Error("Finish onboarding first.");

    const draft = await getProvider().generateNodes({ brief: project.brief, plan, profile });

    // Every step must be accounted for, even if its list is empty.
    const returned = new Set(draft.stepNodes.map((s) => s.stepId));
    const missing = plan.steps.filter((s) => !returned.has(s.id));
    if (missing.length > 0) {
      throw new Error(
        `The directions came back missing ${missing.map((s) => s.id).join(", ")}. Try again.`,
      );
    }

    const nodes: LeverageNode[] = [];
    for (const group of draft.stepNodes) {
      const stepIndex = plan.steps.findIndex((s) => s.id === group.stepId);
      if (stepIndex === -1) {
        throw new Error(`The directions reference an unknown step: ${group.stepId}.`);
      }
      group.nodes.forEach((node, i) => {
        nodes.push({
          id: nodeId(stepIndex + 1, i + 1),
          stepId: group.stepId,
          nodeType: node.nodeType,
          phrase: node.phrase,
          status: "active",
        });
      });
    }

    const nodeSet: NodeSet = {
      id: `nodes-${plan.id}`,
      planVersion: plan.version,
      status: "proposed",
      createdAt: new Date().toISOString(),
      nodes,
    };

    return { ...project, nodeSet };
  });
}

export async function approveNodes(projectId: string): Promise<void> {
  await mutate(projectId, "approve_nodes", (project) => ({
    ...project,
    nodeSet: project.nodeSet
      ? { ...project.nodeSet, status: "approved", approval: approvedNow() }
      : project.nodeSet,
  }));
}
