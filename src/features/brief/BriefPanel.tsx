import { Bullets, Chip, Field, Panel } from "@/components/panel";
import type { Project } from "@/core/types";

/**
 * What the goal actually is. Research about the target, not advice about how
 * to get it - there is deliberately nothing plan-shaped in here.
 */
export function BriefPanel({ project }: { project: Project }) {
  const { brief } = project;
  const approved = brief.status === "approved";

  return (
    <Panel
      title="Brief"
      meta={
        approved ? (
          <Chip tone="done">Approved</Chip>
        ) : (
          <Chip tone="live">Needs your review</Chip>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Objective">
          <p className="text-sm leading-relaxed">{brief.objective}</p>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Done when">
            <p className="text-sm leading-relaxed">{brief.success}</p>
          </Field>
          <Field label="By">
            <p className="text-sm leading-relaxed">{brief.deadline}</p>
          </Field>
        </div>

        {brief.constraints && brief.constraints !== "None stated." && (
          <Field label="Limits">
            <p className="text-sm leading-relaxed">{brief.constraints}</p>
          </Field>
        )}

        <hr className="border-border" />

        <Field label="What this target is">
          <p className="text-sm leading-relaxed">{brief.targetSummary}</p>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="How it works">
            <Bullets items={brief.currentMechanics} />
          </Field>
          <Field label="Who gets in">
            <Bullets items={brief.eligibilityAndFit} />
          </Field>
          <Field label="What it rewards">
            <Bullets items={brief.selectionSignals} />
          </Field>
          <Field label="Still unknown">
            <Bullets items={brief.knownUnknowns} />
          </Field>
        </div>

        {brief.sources.length > 0 && (
          <Field label="Sources">
            <ul className="flex flex-col gap-1">
              {brief.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </Field>
        )}

        {approved && brief.approval && (
          <p className="text-muted-foreground text-xs">
            Approved {new Date(brief.approval.approvedAt).toLocaleString()}
          </p>
        )}
      </div>
    </Panel>
  );
}
