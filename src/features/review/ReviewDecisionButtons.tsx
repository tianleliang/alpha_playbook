"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReviewStatus } from "@/core/types";

import { useReadOnly } from "@/features/demo/ReadOnly";

import { applyReview, decideReview } from "./actions";

export function ReviewDecisionButtons({
  projectId,
  status,
  canAdvance,
}: {
  projectId: string;
  status: ReviewStatus;
  canAdvance: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const readOnly = useReadOnly();

  function run(fn: () => Promise<void>) {
    if (readOnly) return;
    setError(null);
    start(async () => {
      try {
        await fn();
      } catch (e) {
        if (e instanceof Error) setError(e.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === "proposed" ? (
          <>
            <Button size="sm" onClick={() => run(() => decideReview(projectId, true))} disabled={pending || readOnly}>
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              {canAdvance ? "Agree, this step is done" : "Agree"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => run(() => decideReview(projectId, false))}
              disabled={pending || readOnly}
            >
              Disagree, keep working
            </Button>
          </>
        ) : (
          canAdvance && (
            <Button size="sm" onClick={() => run(() => applyReview(projectId))} disabled={pending || readOnly}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Move to the next step
              {!pending && <ArrowRight className="size-3.5" />}
            </Button>
          )
        )}
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
