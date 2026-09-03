"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Generating } from "@/features/workspace/Generating";

import { createGoal } from "./actions";

/** Researching a target is the slowest thing the app does, and the first. */
const RESEARCHING = {
  estimateSeconds: 75,
  phases: [
    "Working out what you are actually aiming at",
    "Finding the official pages",
    "Reading how it currently works",
    "Checking who gets in and what it rewards",
    "Writing up what matters for planning",
  ],
};

/**
 * The box. Everything downstream comes from these four answers, and nothing
 * here is inferred on your behalf.
 */
export function GoalForm() {
  const [objective, setObjective] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    start(async () => {
      try {
        await createGoal(form);
      } catch (e) {
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) setError(e.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Textarea
        name="objective"
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        onFocus={() => setOpen(true)}
        rows={3}
        placeholder="Be specific. What are you actually trying to do?"
        className="min-h-24 resize-y text-base leading-relaxed md:text-base"
        aria-label="Your goal"
      />

      {(open || objective) && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="success">How would you know you had succeeded?</Label>
            <p className="text-muted-foreground text-sm">
              Something you could point at.
            </p>
            <Textarea id="success" name="success" rows={2} className="resize-y" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="deadline">By when?</Label>
            <p className="text-muted-foreground text-sm">
              A date, or roughly when.
            </p>
            <Input id="deadline" name="deadline" placeholder="2027-07-01" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="constraints">Anything limiting how you can chase this?</Label>
            <p className="text-muted-foreground text-sm">Optional.</p>
            <Input id="constraints" name="constraints" />
          </div>
        </div>
      )}

      {error && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {pending ? (
        <div className="border-border bg-card rounded-xl border p-5">
          <Generating stage={RESEARCHING} />
        </div>
      ) : (
        <div>
          <Button type="submit" size="lg" disabled={objective.trim().length < 10}>
            Start
          </Button>
        </div>
      )}
    </form>
  );
}
