"use client";

import { useEffect, useState } from "react";

/**
 * What to look at while a stage runs.
 *
 * These calls take between twenty seconds and four minutes, which is far too
 * long for a spinner. So this shows what is actually happening, roughly how
 * long it should take, and how long it has been.
 *
 * Everything here is either real or honestly hedged. The counts are things the
 * app knows - how many directions are being searched, how many steps are in
 * your plan. The estimate comes from measured runs. The phases are a truthful
 * description of the order the work happens in, not a fake progress bar
 * pretending to read the model's mind.
 */

export interface Stage {
  phases: string[];
  /** From real measured runs. Used for the bar, and stated in plain words. */
  estimateSeconds: number;
}

export function stageFor(
  action: string,
  counts: { steps?: number; directions?: number; finished?: number } = {},
): Stage {
  const { steps = 0, directions = 0, finished = 0 } = counts;
  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  switch (action) {
    case "generate_plan":
      return {
        estimateSeconds: 90,
        phases: [
          "Reading your approved brief",
          "Matching it against your background",
          "Working backwards from your deadline",
          "Finding the advantages only you have",
          "Laying out the timeline",
        ],
      };

    case "generate_nodes":
      return {
        estimateSeconds: 45,
        phases: [
          steps ? `Reading all ${plural(steps, "step")} of your plan` : "Reading your plan",
          "Working out which steps need outside help",
          "Turning those into things worth searching for",
        ],
      };

    case "run_scan":
      return {
        estimateSeconds: 150,
        phases: [
          directions
            ? `Sorting your ${plural(directions, "direction")} by how to search them`
            : "Sorting your directions by how to search them",
          "Searching for programs, groups and openings",
          "Reading the official pages",
          "Checking deadlines and who is eligible",
          "Throwing out anything that would waste your time",
          "Writing up what is left",
        ],
      };

    case "evaluate_step":
      return {
        estimateSeconds: 40,
        phases: [
          finished
            ? `Reading the ${plural(finished, "thing")} you finished`
            : "Reading what you finished",
          "Checking it against your completion signals",
          "Deciding whether this step is genuinely done",
        ],
      };

    default:
      return { estimateSeconds: 30, phases: ["Working"] };
  }
}

export function Generating({ stage }: { stage: Stage }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(timer);
  }, []);

  // Phases are spread across the estimate, and the last one holds if the call
  // runs long. Nothing ever claims to be finished before it is.
  const per = Math.max(6, Math.round(stage.estimateSeconds / stage.phases.length));
  const index = Math.min(Math.floor(elapsed / per), stage.phases.length - 1);
  const overrun = elapsed > stage.estimateSeconds * 1.4;

  // Creeps toward 95% and waits there rather than sitting at 100% while the
  // request is still open.
  const progress = Math.min(95, (elapsed / stage.estimateSeconds) * 95);

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[15px] leading-snug font-medium">
          {stage.phases[index]}
          <span className="inline-flex w-4 justify-start">
            <Dots />
          </span>
        </p>
        <p className="text-muted-foreground font-mono text-[11px] tabular-nums">
          {formatTime(elapsed)}
          <span className="opacity-60">
            {" / "}
            {overrun ? "longer than usual" : `about ${formatTime(stage.estimateSeconds)}`}
          </span>
        </p>
      </div>

      <div className="bg-border h-1 w-full overflow-hidden rounded-full">
        <div
          className="bg-foreground/60 h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        {overrun
          ? "Still going. Long searches usually mean it found a lot to read."
          : `Step ${index + 1} of ${stage.phases.length}. You can leave this page open.`}
      </p>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${String(s).padStart(2, "0")}s`;
}

/** Three dots that fill in and reset. Pauses for reduced-motion. */
function Dots() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = setInterval(() => setN((v) => (v + 1) % 4), 450);
    return () => clearInterval(timer);
  }, []);
  return <span aria-hidden>{".".repeat(n)}</span>;
}
