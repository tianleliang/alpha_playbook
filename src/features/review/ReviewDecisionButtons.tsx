"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReviewStatus } from "@/core/types";
import { useReadOnly } from "@/features/demo/ReadOnly";

import { applyReview, decideReview } from "./actions";

/**
 * What you can do about a verdict.
 *
 * The controls depend on what was decided, which is the part that used to be
 * wrong. A "not yet" verdict has nothing to apply - agreeing just means you
 * carry on. And disagreeing with it moves you on anyway, because the review
 * advises; it does not decide.
 */
export function ReviewDecisionButtons({
  projectId,
  status,
  canAdvance,
}: {
  projectId: string;
  status: ReviewStatus;
  /** Whether the verdict was "advance". */
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

  const busy = pending || readOnly;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === "proposed" && canAdvance && (
          <>
            <Button size="sm" onClick={() => run(() => decideReview(projectId, true))} disabled={busy}>
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              Agree, this step is done
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => run(() => decideReview(projectId, false))}
              disabled={busy}
            >
              Not yet, keep working
            </Button>
          </>
        )}

        {status === "proposed" && !canAdvance && (
          <>
            <Button size="sm" onClick={() => run(() => decideReview(projectId, true))} disabled={busy}>
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              Fair, keep working
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => run(() => applyReview(projectId, true))}
              disabled={busy}
            >
              I disagree, move me on
              <ArrowRight className="size-3.5" />
            </Button>
          </>
        )}

        {/* Only an advance verdict has a transition queued behind it. */}
        {status === "approved" && canAdvance && (
          <Button size="sm" onClick={() => run(() => applyReview(projectId))} disabled={busy}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Move to the next step
            {!pending && <ArrowRight className="size-3.5" />}
          </Button>
        )}
      </div>

      {status === "proposed" && !canAdvance && (
        <p className="text-muted-foreground text-xs">
          This is advice, not a gate. If you know the step is done, move on.
        </p>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
