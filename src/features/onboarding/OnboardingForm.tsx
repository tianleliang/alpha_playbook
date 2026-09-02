"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Generating } from "@/features/workspace/Generating";

import { extractText, saveProfile } from "./actions";

const BUILDING = {
  estimateSeconds: 45,
  phases: [
    "Reading what you wrote",
    "Separating what you can do from what you have built",
    "Noting who you know and what limits you",
    "Looking for what you are not using yet",
  ],
};

const QUESTIONS = [
  {
    name: "direction",
    label: "What are you trying to become, build, or get into?",
    hint: "A couple of sentences. Rough is fine.",
    rows: 3,
  },
  {
    name: "access",
    label: "Who do you already know who could open a door?",
    hint: "Names, roles, or just the kind of person. Optional.",
    rows: 3,
  },
  {
    name: "constraints",
    label: "Anything that genuinely limits you?",
    hint: "Time, money, location, visa, commitments. Optional.",
    rows: 2,
  },
] as const;

export function OnboardingForm() {
  const [resume, setResume] = useState("");
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, startReading] = useTransition();
  const [saving, startSaving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    const body = new FormData();
    body.set("file", file);
    startReading(async () => {
      const result = await extractText(body);
      if (result.error) {
        setError(result.error);
        setFileNote(null);
        return;
      }
      setResume((current) => (current ? `${current}\n\n${result.text}` : result.text));
      setFileNote(`Added ${file.name}`);
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("resume", resume);
    setError(null);
    startSaving(async () => {
      try {
        await saveProfile(form);
      } catch (e) {
        // A redirect throws by design; only report real failures.
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) setError(e.message);
      }
    });
  }

  const ready = resume.trim().length > 40;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-9">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label htmlFor="resume" className="text-base font-medium">
            Paste your resume
          </Label>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={reading}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline disabled:opacity-50"
          >
            {reading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Paperclip className="size-3.5" />
            )}
            {reading ? "Reading..." : "or upload a file"}
          </button>
        </div>
        <p className="text-muted-foreground text-sm">
          Or a LinkedIn dump, or just write out what you have done. Nobody reads this but you and
          the app.
        </p>
        <Textarea
          id="resume"
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          rows={12}
          placeholder="Paste here..."
          className="resize-y font-mono text-[13px] leading-relaxed"
        />
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={onFile}
          className="hidden"
        />
        {fileNote && <p className="text-sm text-emerald-600 dark:text-emerald-400">{fileNote}</p>}
      </div>

      {QUESTIONS.map((q) => (
        <div key={q.name} className="flex flex-col gap-2.5">
          <Label htmlFor={q.name} className="text-base font-medium">
            {q.label}
          </Label>
          <p className="text-muted-foreground text-sm">{q.hint}</p>
          <Textarea id={q.name} name={q.name} rows={q.rows} className="resize-y" />
        </div>
      ))}

      {error && (
        <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {saving ? (
        <div className="border-border bg-card rounded-xl border p-5">
          <Generating stage={BUILDING} />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={!ready}>
            Continue
          </Button>
          {!ready && (
            <span className="text-muted-foreground text-sm">
              Add a bit more background to continue.
            </span>
          )}
        </div>
      )}
    </form>
  );
}
