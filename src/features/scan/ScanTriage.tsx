"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hostnameOf } from "@/core/links";
import type { Scan, ScanResult } from "@/core/types";

import { useReadOnly } from "@/features/demo/ReadOnly";

import { saveSelected } from "./actions";

const KIND: Record<ScanResult["resultType"], string> = {
  concrete_opportunity: "Apply or join",
  search_strategy: "How to find it",
  artifact_action: "Make something",
};

/**
 * Picking what is worth doing.
 *
 * One decision for the whole scan. You tick what you want; everything else is
 * set aside without you having to say no to it. A scan can easily return a
 * dozen things when you care about two, and clicking Ignore ten times is
 * not a decision, it is a chore.
 */
export function ScanTriage({
  projectId,
  scan,
  groups,
}: {
  projectId: string;
  scan: Scan;
  /** Results grouped under the direction that found them, wildcards last. */
  groups: Array<{ label: string; hint?: string; results: ScanResult[] }>;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const readOnly = useReadOnly();

  const open = scan.results.filter((r) => r.status === "proposed");

  function toggle(id: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit(ids: string[]) {
    if (readOnly) return;
    setError(null);
    start(async () => {
      try {
        await saveSelected(projectId, scan.id, ids);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm leading-relaxed">{scan.summary}</p>

      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            {group.hint && (
              <span className="border-border text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
                {group.hint}
              </span>
            )}
            <span className="text-sm font-medium">{group.label}</span>
          </div>

          {group.results.length === 0 ? (
            <p className="text-muted-foreground pl-1 text-sm italic">
              Nothing worth your attention here this time.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {group.results.map((result) => (
                <Row
                  key={result.id}
                  result={result}
                  checked={picked.has(result.id)}
                  onToggle={() => toggle(result.id)}
                  locked={pending || result.status !== "proposed"}
                />
              ))}
            </ul>
          )}
        </div>
      ))}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {open.length > 0 && (
        <div className="border-border bg-card sticky bottom-4 flex flex-wrap items-center gap-3 rounded-xl border p-4 shadow-sm">
          <Button size="lg" onClick={() => submit([...picked])} disabled={pending || readOnly || picked.size === 0}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {picked.size === 0
              ? "Pick what you will actually do"
              : `Add ${picked.size} to my list`}
          </Button>
          <button
            type="button"
            onClick={() => submit([])}
            disabled={pending || readOnly}
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline disabled:opacity-50"
          >
            None of these help
          </button>
          <span className="text-muted-foreground ml-auto text-xs">
            Anything you skip is set aside, not deleted.
          </span>
        </div>
      )}
    </div>
  );
}

function Row({
  result,
  checked,
  onToggle,
  locked,
}: {
  result: ScanResult;
  checked: boolean;
  onToggle: () => void;
  locked: boolean;
}) {
  const decided = result.status !== "proposed";
  const kept = result.status === "saved";
  // A kept result reads as kept, not as greyed-out. Ignored ones recede.
  const shown = checked || kept;

  return (
    <li>
      <label
        className={`flex gap-3 rounded-lg border p-4 transition-colors ${
          kept
            ? "border-emerald-500/50 bg-emerald-500/[0.06]"
            : checked
              ? "border-foreground/40 bg-foreground/[0.03]"
              : "border-border hover:border-foreground/20"
        } ${decided ? "cursor-default" : "cursor-pointer"} ${
          decided && !kept ? "opacity-45" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={shown}
          onChange={onToggle}
          disabled={locked}
          className="sr-only"
        />
        <span
          aria-hidden
          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border ${
            kept
              ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
              : checked
                ? "border-foreground bg-foreground text-background"
                : "border-muted-foreground/40"
          }`}
        >
          {shown && <Check className="size-3" strokeWidth={3} />}
        </span>

        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="text-muted-foreground flex flex-wrap items-center gap-2 font-mono text-[10px]">
            <span className="border-border rounded border px-1.5 py-0.5">
              {KIND[result.resultType]}
            </span>
            <span>{result.confidence} confidence</span>
            {kept && (
              <span className="font-medium text-emerald-700 dark:text-emerald-500">kept</span>
            )}
            {decided && !kept && <span>set aside</span>}
          </span>

          <span className="leading-snug font-medium">{result.title}</span>
          <span className="text-muted-foreground text-sm leading-relaxed">{result.summary}</span>

          <span className="mt-1 flex flex-col gap-1 text-sm">
            <span>
              <span className="text-muted-foreground">Do next </span>
              {result.suggestedAction}
            </span>
            <span className="text-muted-foreground text-xs">{result.timing}</span>
          </span>

          {result.sourceLinks.length > 0 && (
            <span className="mt-1 flex flex-wrap gap-3">
              {result.sourceLinks.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs underline-offset-4 hover:underline"
                >
                  {hostnameOf(link)}
                </a>
              ))}
            </span>
          )}
        </span>
      </label>
    </li>
  );
}
