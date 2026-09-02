# Playbook — agent context

Turns one goal into a plan built on what the user already has, then finds real
outside opportunities that move the current step forward.

Read [ARCHITECTURE.md](ARCHITECTURE.md) before changing anything structural.
[ROADMAP.md](ROADMAP.md) is the running list of what is left.

## The one rule

**The AI never changes state.** It returns schema-validated proposals.
Deterministic code checks them, assigns every id, and applies them only at a
gate the user approved.

If you are about to let a model set a status, mint an id, or decide a
transition — don't. That is what `src/core/` is for.

## Layout

```
src/core/       the nouns (types), the rulebook (flow), saving (store),
                the one write path (mutate), the health check (validate)
src/ai/         six stages behind one interface
  provider.ts   the interface, and what each stage is allowed to see
  prompts.ts    ported from the Obsidian templates
  openai/       production provider
  codex/        local CLI provider, no API key
  mock/         fixtures
src/features/   one folder per screen, with its own actions + components
src/app/        routes, thin
supabase/       schema and RLS policies
```

## Stage input boundaries — do not widen these

| Stage | Sees | Deliberately does NOT see |
|---|---|---|
| researchBrief | the four goal fields | **the profile** |
| generatePlan | brief + profile + date | — |
| generateNodes | brief + plan + profile | — |
| runScan | brief + plan + **current step only** + that step's approved directions + profile | other steps, other scans |
| reviewStep | brief + plan + current step + finished work on it | **the profile**, other steps, scans |

Brief research is blind to the person so the brief describes the target.
Step review is blind to the person so progress is judged on evidence.
This is enforced by not passing the data, not by asking the model nicely.

## Conventions

- Every state change goes through `mutate()`, which re-reads, checks the gate,
  and saves. No exceptions.
- Approvals record actor and time. Never a bare boolean.
- Ids come from `ids.ts` and are derived from content, never from a counter.
- Domain objects are stored as JSONB. Shape changes need no migration.
- Row-level security is what protects user data, not `where` clauses.
- Never display `hard` / `soft` lanes or raw node ids to a user. They are
  internal vocabulary from the original single-user system.

## Commands

```
npm run dev      the app
npm run check    validate a project export, and prove the checker fires
npm run map      regenerate the browsable codebase page
npm run try:openai / try:codex / try:scan    provider smoke tests
```

Env lives in `.env.local`; `.env.example` lists what is needed.
