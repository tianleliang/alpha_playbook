# Playbook

**[playbook-e8xd.onrender.com](https://playbook-e8xd.onrender.com/welcome)** ·
**[See a real run](https://playbook-e8xd.onrender.com/demo)** (no sign-up, loads instantly)

Pick any goal. Playbook researches what you're actually chasing, builds a plan
backwards from it using what you already have, then goes and finds real
opportunities that move the step you're on right now. Finish something, log it,
and it works out whether you're ready for the next step.

---

## How it works

```
Onboarding      a resume and three questions, once
      ↓
Your goal       four fields: what, how you'd know, by when, what limits you
      ↓
Brief           researched off the live web. What this target is, how it
                actually works, who gets in, what it rewards
      ↓
Plan            steps working backwards from your deadline. Every step names
                the specific advantage it uses
      ↓
Leverage nodes  what each step should go looking for: people, communities,
                programs, things to build, open doors
      ↓
Scan            searches the web against the current step only. Real programs,
                real links, real deadlines
      ↓
Opportunities   you tick what you'll actually do. The rest gets set aside
      ↓
Step review     you log what happened. It reads only that evidence and says
                advance, stay, or not enough yet
      ↓
                next step becomes current, and it scans again
```

You approve five of those stages yourself. Nothing moves without you.

### For example

Say someone wants into a top engineering school through early decision.

The brief comes back with how that school's ED round works this cycle and what
it seems to reward. Then the plan puts *"turn your existing robotics code into a
kit other teams can use"* first. Not because that's generically good advice, but
because their resume says they already wrote it and it's sitting unused.

The scan goes looking for live things that help with that one step. It finds a
student ambassador program with open Q&A slots, a club whose members review
public-equity pitches, an alumni network with an actual contact route. Each one
comes with a link, a deadline, and a first message to send.

They do one of them and log what happened. The system reads that and decides
whether it was enough.

---

## Try it

**[Start with the demo](https://playbook-e8xd.onrender.com/demo).** Six stages of
a real run, already generated, annotated as you click through. Takes about a
minute.

Then sign up and run your own goal. Everything's live at that point: real web
search, real research. A plan takes a few minutes to build, which is the reason
the demo exists at all.

---

## What's next

None of this is hypothetical. It's what the tool needs to stop being a good
first draft.

**Editing.** At the moment you can approve what gets generated or throw it away
and regenerate. You can't fix it. If a constraint changes halfway through, you
should be able to edit the plan, or one step, or a single opportunity, and have
everything downstream respect that.

**Memory that builds.** Onboarding is a resume and three questions, which is
thin. It should get to know you over time: you add context as you go, and every
plan and every scan gets sharper because it understands more of your life. The
profile is what makes any of this personal, so it's the piece most worth
deepening.

**Scheduled scans.** Right now you scan a step once and work from that batch.
Weekly scans would keep things arriving as deadlines open and close, instead of
freezing your options at whatever happened to exist the day you started.

**Better onboarding.** Uploading a resume is the lowest-friction thing that
works. It isn't the right thing.

**Settings.** You can't currently edit your own profile at all.

**Quality.** Sharper scans, better plans. That's prompt work, and it comes after
the structural pieces.

---

## What's in it

**Accounts.** Supabase Auth, email and password. Middleware refreshes the session
on every request and gates every route, so a signed-out visitor lands on the
landing page instead of a broken workspace.

**A real database.** Postgres, two tables, domain objects stored as JSONB.
Ownership is enforced by row-level security rather than by `where` clauses in the
app, which means there's no policy that would let one account read another's rows
even if the application code had a bug.

**Live API calls.** OpenAI's Responses API with structured outputs and hosted web
search. Six stages sit behind one interface with three implementations (OpenAI, a
local CLI, and fixtures), and nothing else in the app can tell which one is
running. Every response gets schema-checked before it's allowed anywhere near
your data.

**Typed objects with real state machines.** Eleven of them, each with the states
it's allowed to be in and the transitions it's allowed to make. `src/core/flow.ts`
is the whole rulebook, and the interface asks it what to show rather than
deciding for itself.

**Components, one folder per screen.** Onboarding, goal, brief, plan, nodes,
scan, opportunities, review. Each owns its own server actions and its own
components.

**Mobile.** The two-column workspace collapses to one, and the demo's callouts
move from a side gutter to stacked, so the connector lines still make sense on a
phone.

**Animation where it earns its place.** Model calls take between 20 seconds and
three minutes, which is far too long for a spinner, so each stage shows what it's
doing, roughly how long it takes (from measured runs), and how long it's been.
Plus a progress rail that fills as steps complete, and a light/dark toggle that
sets itself before paint so there's no flash.

**Spend guards.** A lock so one goal can't run two model calls at once, a
cooldown on re-scanning, and a daily ceiling. Worth having when every scan is a
live web search.

**A health check** that verifies every relationship in your data: orphaned
references, duplicate ids, reviews that no longer match what they judged.

**Three test suites** over the state machine, the review flow, and the spend
policy. `npm run check:all`.

---

## Time spent

Around **10 hours**. Roughly a third on the domain model and the state machine, a
third wiring up live AI, accounts and the database, and the rest on the
interface, the demo, and the spend guards.

---

## Running it

It's deployed, so the easiest thing is just to open it:

### **[playbook-e8xd.onrender.com](https://playbook-e8xd.onrender.com/welcome)**

[The demo](https://playbook-e8xd.onrender.com/demo) needs no account and loads
instantly. Signing up runs everything live.

> Free hosting sleeps after 15 minutes idle, so a cold first visit takes 30 to 50
> seconds to wake up. It's quick after that.

### Or locally

```bash
npm install
npm run dev
```

Then <http://localhost:3000>.

Copy `.env.example` to `.env.local`:

```
PLAYBOOK_PROVIDER=openai        # openai | codex | mock
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`supabase/migrations/0001_init.sql` creates the tables and their policies. Paste
it into the Supabase SQL editor.

**No API key?** Set `PLAYBOOK_PROVIDER=mock`. Every stage returns a fixture and
the whole loop still works.

```bash
npm run check:all     # state machine, review flow, spend policy
npm run map           # a browsable page of the codebase
```

---

## How it's put together

This ran as a file system before it was an app. The whole loop lived in an
Obsidian vault: Markdown as the source of truth, TypeScript scripts for every
state change, prompts and JSON schemas sitting in folders, and an index rebuilt
by parsing tags back out of the notes. It worked fine for one person who knew
where everything was.

Rebuilding it meant keeping the process and dropping the accidents. The prompts
and the object contract came across almost intact. All the Markdown parsing and
the hand-maintained tags and the regenerated index just stopped existing, because
in a typed model "all the steps in this plan" is `plan.steps`.

The rule everything is built around is that **the AI never changes state**. It
returns proposals. Deterministic code checks them, assigns every id, and applies
them only at a gate you approved. So the model can be swapped out, mocked, or
simply wrong, and nothing gets corrupted.

Feature-based layout, one folder per screen, each owning its own server actions
and components:

```
src/core/       the nouns, the rulebook, saving, the health check
src/ai/         six stages behind one interface (openai / codex / mock)
src/features/   onboarding, goal, brief, plan, nodes, scan, opportunities, review
src/app/        routes, thin
supabase/       schema and row-level security
```

[ARCHITECTURE.md](ARCHITECTURE.md) has the detail. The bit worth reading is what
each AI stage is allowed to see, because two of the six are deliberately blind to
your profile, and that's enforced by not passing the data rather than by asking
the model nicely.

[ROADMAP.md](ROADMAP.md) is the longer version of what's next.
