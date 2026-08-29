"use client";

import { useState, useTransition } from "react";
import { Bookmark, Clock, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ScanResult } from "@/core/types";

import { decideResult } from "./actions";

const RESULT_KIND: Record<ScanResult["resultType"], string> = {
  concrete_opportunity: "Opportunity",
  search_strategy: "How to look",
  artifact_action: "Something to make",
};

const DECIDED: Record<string, string> = {
  saved: "Saved",
  ignored: "Ignored",
  deferred: "Later",
};

/**
 * One scan result, with the three things you can do about it.
 *
 * Each decision names one specific result. Nothing sweeps the whole page, so
 * old results can never be re-promoted by a later action.
 */
export function ResultCard({ projectId, result }: { projectId: string; result: ScanResult }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const decided = result.status !== "proposed";

  function decide(decision: "saved" | "ignored" | "deferred") {
    setError(null);
    start(async () => {
      try {
        await decideResult(projectId, result.scanId, result.id, decision);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
      }
    });
  }

  return (
    <li
      className={`border-border rounded-lg border p-4 ${
        result.status === "ignored" ? "opacity-50" : ""
      }`}
    >
      <div className="text-muted-foreground mb-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px]">
        <span className="border-border rounded border px-1.5 py-0.5">
          {RESULT_KIND[result.resultType]}
        </span>
        <span>{result.lane}</span>
        <span>&middot;</span>
        <span>{result.confidence} confidence</span>
        {result.isWildcard && <span className="text-amber-600 dark:text-amber-400">wildcard</span>}
      </div>

      <h4 className="leading-snug font-medium">{result.title}</h4>
      <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{result.summary}</p>

      {result.whyMissedByNodes && (
        <p className="text-muted-foreground mt-2 text-sm italic">{result.whyMissedByNodes}</p>
      )}

      <dl className="mt-3 flex flex-col gap-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground shrink-0">Do next</dt>
          <dd>{result.suggestedAction}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground shrink-0">Timing</dt>
          <dd>{result.timing}</dd>
        </div>
      </dl>

      {result.sourceLinks.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-3">
          {result.sourceLinks.map((link) => (
            <li key={link}>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline-offset-4 hover:underline"
              >
                {new URL(link).hostname}
              </a>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        {decided ? (
          <span className="text-muted-foreground font-mono text-[11px]">
            {DECIDED[result.status]}
          </span>
        ) : (
          <>
            <Button size="sm" onClick={() => decide("saved")} disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Bookmark className="size-3.5" />}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => decide("deferred")}
              disabled={pending}
            >
              <Clock className="size-3.5" />
              Later
            </Button>
            <Button size="sm" variant="ghost" onClick={() => decide("ignored")} disabled={pending}>
              <X className="size-3.5" />
              Ignore
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
