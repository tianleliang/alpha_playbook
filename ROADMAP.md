# Roadmap

Running list. Add to it whenever something gets deferred; tick things off as
they land. Newest thinking wins — this file is meant to be edited, not archived.

**Built so far:** the whole goal → plan → directions → scan → act → review →
advance loop, running on fixtures. See [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Next session

### 1. Real AI — the Codex provider

The single highest-leverage thing left. Everything else is polish on top of
fake output.

- [ ] `src/ai/codex/index.ts` implementing `AiProvider`, shelling out to the
      Codex CLI already installed at `~/AppData/Roaming/npm/codex`.
- [ ] Reuse the proven call shape from the Obsidian scripts:
      `codex exec --ephemeral --sandbox read-only --output-schema <file>
      --output-last-message <file>`, prompt over stdin.
- [ ] `--search` on for brief research and scans; off for plan, directions,
      and step review.
- [ ] Convert the Zod schemas to JSON Schema for `--output-schema`, then parse
      the response back through Zod. One source of truth, both directions.
- [ ] `getProvider()` reads `PLAYBOOK_PROVIDER=codex|mock`, defaulting to mock.
- [ ] Port the four prompt files from `06 Alpha/templates/` and the step-review
      prompt from `evaluate-step.ts`, keeping stage inputs isolated exactly as
      the table in ARCHITECTURE.md describes.
- [ ] Timeouts, one retry at most, and a clear error in the UI when a call
      fails. Never a silent half-write.
- [ ] Drop the **Demo data** chip automatically when the provider is real.

**Watch for:** the mock's resume parsing is deliberately naive and currently
puts your name in the capabilities bucket, which is why a plan step reads
"Turn Tianle Liang into something someone else can look at." Real synthesis
fixes this. Do not build a better fixture parser.

### 2. Editing — the biggest hole

The acceptance test says "review / **edit** / approve" at three gates. Only
review and approve exist. You cannot fix a wrong brief or reword a step.

- [ ] Inline edit on the brief fields, plan steps, and direction phrases.
- [ ] Edits create a revision rather than overwriting, so regeneration never
      silently eats your corrections.
- [ ] Feedback-driven revision: describe what is wrong, get a proposed diff,
      approve or reject it. Decide whether this is one universal control or
      per-artifact.

*(Carried over from the Obsidian task list, Stage 2 track 1 — still the right
priority.)*

### 3. The small gaps from tonight

- [ ] **Deferred results have nowhere to go.** You can mark one "Later" and
      then never see it again. Needs a place they come back.
- [ ] **No history panel.** Past scans, dropped opportunities, and old reviews
      are all saved and none of them are displayed.
- [ ] **Regeneration replaces instead of versioning.** `plan-v2` is supported by
      the types and never produced.
- [ ] **Skipped steps.** The status exists; nothing can set it.
- [ ] **Project actions.** No pause, archive, or delete from the UI.
- [ ] **Deleting a goal** means deleting a file by hand.

---

## Bigger features

### Real personal context

Onboarding currently produces a thin profile from a resume. The real thing is
the Personal Leverage Map.

- [ ] Import a generated map as a `PersonalContextProvider` — the interface
      already exists and expects exactly this.
- [ ] Keep source links so the plan can cite where a claim came from.
- [ ] Detect when the profile has changed since a plan was built
      (`plan.profileHash` is already stored for this) and offer a re-plan.
- [ ] Decide what onboarding looks like for someone who is *not* you and has
      no vault.

### Accounts and hosting

Out of scope tonight on purpose. When it happens:

- [ ] Auth. Supabase is the assumed direction.
- [ ] Move persistence behind the same `store.ts` interface — Postgres tables
      mirroring the object contract, or JSONB per project to start.
- [ ] Multi-user: every project scoped to an owner.
- [ ] Migration path from local JSON, so tonight's data is not stranded.
- [ ] Keep local-only mode working. It is the best development story and the
      most honest privacy story.

### The daily layer

Your vision was "new tasks every day — a whole second brain." Nothing in the
current design does this, and it is an addition rather than a missing piece.

Steps are month-scale. Opportunities are things you chose. Neither is a daily
task. This needs a genuinely new object, probably derived rather than stored:
today's surface = current step's moves + active opportunities with near timing
+ anything overdue.

- [ ] Decide whether daily items are derived (recomputed each morning) or
      stored (checkable, with their own history). Derived is cheaper and
      cannot drift; stored is what lets you look back.
- [ ] A morning view that is not the whole workspace.
- [ ] Only after that: scheduling, reminders, notifications.

### Scheduled scans

- [ ] Weekly scan per active project, once scan quality is worth automating.
- [ ] Due-state and locking live in the app, not in a scheduler — the Obsidian
      version learned this the hard way.
- [ ] Do not build this before real AI. Scheduling fixtures is pointless.

### Scan quality

*(Carried from the Obsidian task list, Stage 2 track 2. Only actionable once
scans are real.)*

- [ ] Reduce verbosity while keeping enough for promotion and later reasoning.
- [ ] Separate artifact/action recommendations from external opportunities more
      clearly than the current three result types manage.
- [ ] Bias `standard_programs` and `direct_opportunities` toward genuinely
      application-based results.
- [ ] Make soft-lane results into real playbooks: where to look, first ask,
      fit signal.
- [ ] Retune the broad-vs-local balance against a non-Z-Fellows goal.

---

## Before this goes public

- [ ] Synthetic demo data only. Nothing personal in the repo.
- [ ] `.env.example`, no secrets.
- [ ] Confirm it runs with no access to the Obsidian vault.
- [ ] Document the state machine and the AI/code boundary — ARCHITECTURE.md is
      most of this already.
- [ ] Nothing from Broad Brief. Different product, deliberately kept out.
- [ ] Real tests, not just `npm run check`. The state machine and the
      transition logic deserve unit tests.

---

## Deliberately not doing

Worth keeping visible so they do not creep back in.

- **Nested requirement checklists under steps.** Tried in the old system,
  discarded. Steps are judged, not ticked off.
- **Auto-promoting scan results.** Every promotion stays an explicit choice.
- **Letting the AI write state directly.** It proposes; code applies.
- **Broad Brief.** Separate product. Do not let its discovery architecture
  redefine this one.
