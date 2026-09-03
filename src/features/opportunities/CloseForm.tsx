"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useReadOnly } from "@/features/demo/ReadOnly";
import { Spotlight } from "@/features/demo/Spotlight";

import { closeOpportunity } from "./actions";

/**
 * Recording an outcome. Both fields are shown, but only one has to be filled -
 * the point is to capture something real, not to complete a form.
 */
export function CloseForm({
  projectId,
  opportunityId,
  spotlight,
}: {
  projectId: string;
  opportunityId: string;
  /** Demo only: wraps the button in a callout explaining what it does. */
  spotlight?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [impact, setImpact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const readOnly = useReadOnly();

  function close(action: "finish" | "deactivate") {
    if (readOnly) return;
    setError(null);
    start(async () => {
      try {
        await closeOpportunity(projectId, opportunityId, action, notes, impact);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
      }
    });
  }

  if (!open) {
    const button = (
      <Button size="sm" variant="outline" disabled={readOnly} onClick={() => setOpen(true)}>
        Record what happened
      </Button>
    );
    return (
      <div className="mt-3">
        {spotlight ? (
          <Spotlight label="How you move forward" note={spotlight}>
            {button}
          </Spotlight>
        ) : (
          button
        )}
      </div>
    );
  }

  return (
    <div className="border-border mt-4 flex flex-col gap-4 border-t pt-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`notes-${opportunityId}`} className="text-sm">
          What happened?
        </Label>
        <Textarea
          id={`notes-${opportunityId}`}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-y"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`impact-${opportunityId}`} className="text-sm">
          What did it change?
        </Label>
        <Textarea
          id={`impact-${opportunityId}`}
          rows={2}
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          className="resize-y"
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => close("finish")} disabled={pending}>
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          Finished it
        </Button>
        <Button size="sm" variant="ghost" onClick={() => close("deactivate")} disabled={pending}>
          Dropped it
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
