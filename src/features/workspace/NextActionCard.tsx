"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NextAction } from "@/core/flow";

import { useReadOnly } from "@/features/demo/ReadOnly";

import { Generating, stageFor } from "./Generating";
import { runStageAction } from "./actions";

/** Stages that call an AI and therefore take real time. */
const SLOW = new Set(["generate_plan", "generate_nodes", "run_scan", "evaluate_step"]);

/**
 * The one thing to do now. Deliberately singular - the whole point is that you
 * are never looking at twelve equal buttons wondering which one matters.
 */
export function NextActionCard({
  projectId,
  action,
  counts,
}: {
  projectId: string;
  action: NextAction;
  /** Real numbers from the project, so the waiting screen can be specific. */
  counts: { steps: number; directions: number; finished: number };
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const readOnly = useReadOnly();

  function run() {
    if (readOnly) return;
    setError(null);
    start(async () => {
      try {
        await runStageAction(projectId, action.action);
      } catch (e) {
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) setError(e.message);
      }
    });
  }

  // No label means there is nothing to press - just a note about what is next.
  if (!action.label) {
    return (
      <section className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-sm leading-relaxed">{action.why}</p>
      </section>
    );
  }

  if (pending && SLOW.has(action.action)) {
    return (
      <section className="border-foreground/15 bg-card rounded-xl border p-5 shadow-sm">
        <Generating stage={stageFor(action.action, counts)} />
      </section>
    );
  }

  return (
    <section className="border-foreground/15 bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
          Next
        </p>
        <p className="text-base leading-snug font-medium">{action.why}</p>
        {error && <p className="text-destructive mt-1 text-sm">{error}</p>}
      </div>
      <Button size="lg" onClick={run} disabled={pending || readOnly} className="shrink-0">
        {pending ? "Working..." : action.label}
        {!pending && <ArrowRight className="size-4" />}
      </Button>
    </section>
  );
}
