"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NextAction } from "@/core/flow";

import { runStageAction } from "./actions";

/**
 * The one thing to do now. Deliberately singular - the whole point is that you
 * are never looking at twelve equal buttons wondering which one matters.
 */
export function NextActionCard({
  projectId,
  action,
}: {
  projectId: string;
  action: NextAction;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run() {
    setError(null);
    start(async () => {
      try {
        await runStageAction(projectId, action.action);
      } catch (e) {
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) setError(e.message);
      }
    });
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
      <Button size="lg" onClick={run} disabled={pending} className="shrink-0">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Working..." : action.label}
        {!pending && <ArrowRight className="size-4" />}
      </Button>
    </section>
  );
}
