# Playbook

**Live:** [playbook-e8xd.onrender.com](https://playbook-e8xd.onrender.com/welcome)
· **See a real run:** [/demo](https://playbook-e8xd.onrender.com/demo) — no sign-up, loads instantly

> The free Render tier sleeps after 15 minutes idle, so a cold first visit can
> take 30–50 seconds to wake. It is normal after that.

---

## What it does

Most planning tools give everyone the same advice. Playbook reads your actual
background, researches the thing you are chasing, and works backwards from it —
then goes and finds real programs, people and deadlines for the step you are on
right now.

One goal goes in. What comes out is a researched brief on the target, a plan
whose every step names the specific advantage it uses, and a scan of the live
web for opportunities that move your current step. You choose what to act on,
log what happened, and the system judges from that evidence whether the step is
genuinely done before it moves you on.

**The rule the whole thing is built around: the AI never changes anything.** It
returns proposals. Deterministic code validates them, assigns every id, and
applies them only at a gate a human approved. That is why a model can be
swapped, mocked, or simply wrong without corrupting your data.

### Try the demo first

`/demo` walks the six stages a real user walks — profile, brief, plan, leverage
nodes, opportunity scan, working on it — already generated, so it takes about a
minute instead of eight. Every stage is annotated: a ring around the actual
control, a line, and a note saying what the system decided on its own versus
what the person chose.

It is a real run, frozen. The opportunities in it are real programs with real
application pages. Names of private individuals have been replaced; public
institutions are untouched.

---

## Features

**Backend**

- **User registration / login / logout** — Supabase Auth, email and password.
  Middleware refreshes the session on every request and gates every route.
- **Database** — Postgres via Supabase. Two tables, domain objects stored as
  JSONB. **Ownership is enforced by row-level security, not by application
  code**: there is no policy that would let one account read another's rows, so
  an app bug cannot leak data.
- **API calls** — the OpenAI Responses API with structured outputs and the
  hosted web-search tool, behind an interface with three implementations
  (OpenAI, a local Codex CLI, and fixtures) that the rest of the app cannot
  tell apart.
- **Classes and objects** — eleven typed domain objects with explicit state
  machines. `src/core/types.ts` is the whole vocabulary.

**Frontend**

- **Components** — one folder per screen under `src/features/`, each owning its
  own server actions and components.
- **Mobile responsive** — the two-column workspace collapses to one, and the
  demo's callouts move from a side gutter to stacked, so the connector lines
  survive on a phone.
- **Animations** — stage-aware loading states with real counts and measured
  estimates, a progress rail that fills as steps complete, and a theme toggle.
  All of it respects `prefers-reduced-motion`.

**Full stack** — Next.js App Router: React components and server actions in one
codebase, with the database and every model call behind the server boundary.

**Other things worth a look**

- **Light and dark**, remembered, set before paint so there is no flash.
- **Spend guards** — a lock so one goal cannot run two model calls at once, a
  cooldown on re-scanning, and a daily ceiling. `src/core/limits.ts`.
- **A health check** that verifies every relationship in your data — orphaned
  references, duplicate ids, reviews that no longer match what they judged.
- **Three test suites** covering the state machine, the review flow, and the
  spend policy: `npm run check:all`.

---

## Time spent

About **14 hours** across three evenings, 28 August to 3 September.

Roughly: 4 hours on the domain model, state machine and the loop running on
fixtures; 3 hours wiring live AI, accounts and Postgres; 3 hours restructuring
the workspace and building the demo; 2 hours on design; 2 hours on spend guards,
bug fixes and deployment.

The brief suggested four. I kept going because the interesting problem here was
not "build a CRUD app" but "let a model do the judgment without letting it touch
the state", and that is worth more than four hours.

---

## Running it locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

Copy `.env.example` to `.env.local` and fill it in:

```
PLAYBOOK_PROVIDER=openai        # openai | codex | mock
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`supabase/migrations/0001_init.sql` creates the two tables and their policies —
paste it into the Supabase SQL editor.

**No API key?** Set `PLAYBOOK_PROVIDER=mock`. Every stage returns a fixture, the
whole loop is walkable, and nothing is called.

### Other commands

```bash
npm run check:all     # state machine, review flow, spend policy
npm run map           # regenerate a browsable page of the codebase
npm run build         # production build
```

---

## How it is put together

```
src/core/       the nouns, the rulebook, saving, the one write path, the health check
src/ai/         six stages behind one interface (openai / codex / mock)
src/features/   one folder per screen, with its own actions and components
src/app/        routes, thin
supabase/       schema and row-level security policies
```

[ARCHITECTURE.md](ARCHITECTURE.md) covers the loop, the objects, and the data
flow. The part worth reading is **what each AI stage is allowed to see** — two
of the six are deliberately blind to the user's profile, and it is enforced by
not passing the data rather than by asking the model nicely.

[ROADMAP.md](ROADMAP.md) is what is left.

---

## Credits

Built from a specification for an Obsidian-based system I had been running by
hand. The prompts and the object contract are ported from it; the state machine,
the storage, and the interface are new.
