import { Chip, Field, Panel } from "@/components/panel";
import { isReviewStale, openReview } from "@/core/flow";
import type { Project, ReviewDecision } from "@/core/types";

import { ReviewDecisionButtons } from "./ReviewDecisionButtons";

const DECISION_LABEL: Record<ReviewDecision, string> = {
  advance: "Ready to move on",
  stay: "Stay on this step",
  needs_more_evidence: "Not enough evidence yet",
  revise_plan: "The plan needs revising",
};

/**
 * The verdict on the current step. Always a recommendation - nothing moves
 * until you say so, and a review that no longer matches the project cannot
 * be applied at all.
 */
export function ReviewPanel({ project }: { project: Project }) {
  const review = openReview(project);
  if (!review) return null;

  const stale = isReviewStale(project, review);
  const approved = review.status === "approved";

  return (
    <Panel
      title="Step Review"
      tone={stale ? undefined : "live"}
      meta={
        stale ? (
          <Chip>Out of date</Chip>
        ) : approved ? (
          <Chip tone="done">Approved</Chip>
        ) : (
          <Chip tone="live">Waiting on you</Chip>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-lg font-medium">{DECISION_LABEL[review.decision]}</p>
          <p className="text-muted-foreground mt-1 font-mono text-[11px]">
            {review.fromStepId}
            {review.toStepId ? ` → ${review.toStepId}` : ""}
          </p>
        </div>

        <Field label="Why">
          <p className="text-sm leading-relaxed">{review.reasoning}</p>
        </Field>

        <Field label="What it looked at">
          <p className="text-sm leading-relaxed">{review.evidenceSummary}</p>
        </Field>

        {stale ? (
          <p className="text-muted-foreground border-border rounded-md border border-dashed px-3 py-2 text-sm">
            The plan or the evidence changed after this was written, so it cannot be applied. Run a
            fresh check.
          </p>
        ) : (
          <ReviewDecisionButtons
            projectId={project.id}
            status={review.status}
            canAdvance={review.decision === "advance"}
          />
        )}
      </div>
    </Panel>
  );
}
