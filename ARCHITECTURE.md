# How Playbook works

## The one idea

The AI never changes anything. It returns **proposals**. Deterministic code
checks each proposal, assigns the ids, and applies it only at the gate where
you said yes.

That split is why the model can be swapped, mocked, or wrong without corrupting
your data. It also means every consequential move in the system is yours.

```
AI owns          research, planning, leverage synthesis, discovery, judgment
Code owns        ids, statuses, transitions, eligibility, validation,
                 lineage, limits, saving, approvals
```

## What you see

### Onboarding — once, ever

Paste a resume, answer three questions. That becomes a **Profile**: seven
buckets describing where you are, what you can do, what you have built, who you
know, where you are heading, what is going unused, and what is unclear.

The Profile fills the same slot the Personal Leverage Map fills in the Obsidian
system. When a real vault export replaces it, nothing downstream changes.

### The goal box

Four fields, and nothing is inferred on your behalf:

1. what you are trying to do
2. how you would know you succeeded
3. by when
4. anything limiting you

### The workspace

One page per goal. Panels stack in the order you actually look at them, and a
single card at the top says the one thing to do next — not twelve equal buttons.

```
Next action          the only thing that matters right now
Progress check       a step review, when one is waiting
The plan             timeline, current step expanded
What it found        the latest scan, grouped by search direction
Working on           opportunities you took on
What to look for     leverage directions, by step
The goal             the researched brief
Health               every relationship, verified
```

## The loop

```
   goal
     │  AI researches the target
     ▼
   brief ─────────── you approve ──────────┐
                                           ▼
                             AI plans from brief + profile
                                           │
                                           ▼
                       plan ──────── you approve ──────────┐
                                                           ▼
                                        AI proposes search directions
                                                           │
                                                           ▼
                           directions ──── you approve ────────────┐
                                                                   ▼
                                              AI scans the current step only
                                                                   │
                                                                   ▼
                                results ── you save / defer / ignore each one
                                                                   │
                                              saved ones become opportunities
                                                                   │
                                       you finish or drop each, with notes
                                                                   ▼
                                            AI reviews: is this step done?
                                                                   │
                                              ▼────── you approve ─┘
                                     code completes the step, makes the
                                     next one current, and you scan again
```

Five gates. Every one records who approved it and when — not a checkbox.

## What each AI stage is allowed to see

This table is the most important thing in the system. Two stages are
deliberately blind, and it is enforced by not passing the data in rather than
by asking the model nicely.

| Stage | Sees | Deliberately does **not** see |
|---|---|---|
| Profile synthesis | what you pasted | — |
| **Brief research** | the four goal fields | **your profile** |
| Plan | brief + profile + today | — |
| Directions | brief + plan + profile | — |
| Scan | brief + plan + **current step only** + that step's approved directions + profile | other steps, other scans |
| **Step review** | brief + plan + current step + finished work on that step | **your profile**, other steps, scans |

Brief research is blind to you so the brief describes what the goal *is*,
uncoloured by who is chasing it. Step review is blind to you because whether a
step is done is a question about evidence, not about how capable you are.

## Data flow, concretely

A click travels:

```
button (client)
  → server action in features/<thing>/actions.ts
      → mutate(projectId, action, change)          ← src/core/mutate.ts
          ├─ readProject()                         reload fresh from Postgres
          ├─ can(project, action)?                 ask the rulebook
          │     └─ no → throw, nothing happens
          ├─ change(project)                       may call an AI stage
          │     └─ zod validates the response      bad shape → throw
          └─ writeProject()                        upsert, scoped to you by RLS
  → revalidatePath() → page re-renders from the database
```

Nothing is held in memory between requests. Every action re-reads state, so a
stale tab, a double click, or a hand-made request cannot skip a gate.

## The objects

```
Project                 one goal and everything that happened to it
 ├─ Brief               what the target is · review → approved
 ├─ Plan       plan-v1  proposed → approved → archived
 │   └─ Step   step-01  current → complete (or pending / skipped)
 ├─ NodeSet             proposed → approved
 │   └─ Node   node-01-01   a search direction, tied to a step
 ├─ Scan       scan-2026-08-29   proposed → reviewed
 │   └─ Result result-01   proposed → saved / ignored / deferred
 ├─ Opportunity  opp-2026-08-29-result-01   active → finished / inactive
 └─ Review     review-plan-v1-step-01-2026-08-29
                        proposed → approved → applied (or rejected / stale)
```

Big containers get globally unique ids. Nested things get short readable ones
that are unique inside their parent — `step-01` means nothing alone, and
everything as part of a specific plan.

**Opportunity ids come from where the opportunity came from**, never from a
counter. Saving the same result twice produces the same id, so it is a no-op
instead of a duplicate.

## Storage

Postgres, via Supabase. Two tables:

```sql
profiles ( user_id uuid pk, data jsonb, updated_at )
projects ( id text, user_id uuid, data jsonb, updated_at, pk (user_id, id) )
```

The domain objects go in as JSONB exactly as `types.ts` defines them. Postgres
owns identity and ownership; the app owns the shape. A change to what a Project
contains needs no migration.

Ownership is enforced by row-level security, not by application code. There is
no policy that would let one account read another's rows, so a bug in the app
cannot leak data. Project ids are derived from the goal, so two users can
independently arrive at the same one — which is why ownership is part of the
primary key.

Everything goes through `src/core/store.ts`. Moving to another database means
rewriting that one file.

## Accounts

Supabase Auth, email and password. `src/middleware.ts` refreshes the session on
every request and bounces signed-out visitors to `/login`. Server code always
asks for the user with `getUser()`, never `getSession()` — the latter trusts the
cookie without checking it.

Passwords are never seen, stored, or logged by this app; they go straight to
Supabase.

## The health check

`src/core/validate.ts` verifies every relationship: ids unique, exactly one
current step, directions pointing at real steps, results pointing at real
directions, opportunities traceable to the result they came from, reviews still
matching the plan and evidence they were written against.

It reports and never repairs. Silently rewriting your data to clear a warning is
how you lose work.

In the Obsidian version this had to rebuild an index by parsing tags out of
Markdown, because the relationships only existed as text. Here the relationships
*are* the data structure, so there is no index — only verification.

## Why reviews cannot go stale on you

A review records four things about the moment it was written: the plan version,
the step it judged, its own status, and a fingerprint of the exact evidence it
saw. Before it can be applied, all four must still match.

Change the plan, advance the step, or finish something new, and the review
refuses to apply and tells you to run a fresh one.

## Stack

Next.js App Router · TypeScript · Tailwind · shadcn/ui · Zod · Supabase
(Postgres + Auth) · OpenAI, with a local Codex CLI provider and a fixture
provider behind the same interface.
