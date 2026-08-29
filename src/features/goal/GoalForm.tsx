"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createGoal } from "./actions";

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
              Something you could point at, not a feeling.
            </p>
            <Textarea id="success" name="success" rows={2} className="resize-y" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="deadline">By when?</Label>
            <p className="text-muted-foreground text-sm">
              A date, or a rough horizon like &ldquo;within a year&rdquo;.
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

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={objective.trim().length < 10 || pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Researching the target..." : "Start"}
        </Button>
        {pending && (
          <span className="text-muted-foreground text-sm">
            Working out what this goal actually involves.
          </span>
        )}
      </div>
    </form>
  );
}
