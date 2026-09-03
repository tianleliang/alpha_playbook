import { activeOpportunities } from "@/core/flow";
import { hostnameOf } from "@/core/links";
import type { Opportunity, Project } from "@/core/types";
import type { ReactNode } from "react";

import { CloseForm } from "./CloseForm";

/**
 * The list.
 *
 * Things you chose to do, and nothing else. Each one keeps a quiet way to say
 * you finished it - there is no prompt demanding you log anything, because
 * logging is a record of what happened, not a task in its own right.
 *
 * Items carry across steps. One from an earlier step stays here, labelled, so
 * work is never silently dropped when the plan moves on.
 */
export function TodoList({
  project,
  spotlight,
}: {
  project: Project;
  /** Demo only: a callout on the first item, explaining how progress works. */
  spotlight?: ReactNode;
}) {
  const active = activeOpportunities(project);
  const currentStepId = project.currentStepId;
  const finishedHere = project.opportunities.filter(
    (o) => o.status === "finished" && o.stepId === currentStepId,
  );

  if (active.length === 0 && finishedHere.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Opportunities</h2>
        <p className="text-muted-foreground text-xs">
          {finishedHere.length > 0 && `${finishedHere.length} done · `}
          {active.length} to do
        </p>
      </div>

      {active.length > 0 && (
        <ul className="flex flex-col gap-3">
          {active.map((item, i) => (
            <Item
              key={item.id}
              projectId={project.id}
              item={item}
              fromEarlierStep={item.stepId !== currentStepId}
              spotlight={i === 0 ? spotlight : undefined}
            />
          ))}
        </ul>
      )}

      {finishedHere.length > 0 && (
        <details className="border-border border-t pt-4">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none text-sm underline-offset-4 hover:underline">
            {finishedHere.length} finished on this step
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {finishedHere.map((item) => (
              <li key={item.id} className="text-sm leading-relaxed">
                <span className="text-muted-foreground line-through">{item.title}</span>
                {item.outcome?.impact && (
                  <span className="text-muted-foreground"> &mdash; {item.outcome.impact}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      {active.length > 0 && finishedHere.length === 0 && (
        <p className="text-muted-foreground text-xs">
          Finish one and we will check whether the step is done.
        </p>
      )}
    </section>
  );
}

function Item({
  projectId,
  item,
  fromEarlierStep,
  spotlight,
}: {
  projectId: string;
  item: Opportunity;
  fromEarlierStep: boolean;
  spotlight?: ReactNode;
}) {
  return (
    <li className="border-border rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="leading-snug font-medium">{item.title}</h3>
        {fromEarlierStep && (
          <span className="text-muted-foreground border-border shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px]">
            earlier step
          </span>
        )}
      </div>

      <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{item.summary}</p>

      <p className="mt-3 text-sm">
        <span className="text-muted-foreground">Do next </span>
        {item.suggestedAction}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">{item.timing}</p>

      {item.sourceLinks.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-3">
          {item.sourceLinks.map((link) => (
            <li key={link}>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline-offset-4 hover:underline"
              >
                {hostnameOf(link)}
              </a>
            </li>
          ))}
        </ul>
      )}

      <CloseForm projectId={projectId} opportunityId={item.id} spotlight={spotlight} />
    </li>
  );
}
