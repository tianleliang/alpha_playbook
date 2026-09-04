# Playbook

**[playbook-e8xd.onrender.com](https://playbook-e8xd.onrender.com/welcome)** ·
**[See a real run](https://playbook-e8xd.onrender.com/demo)** — no sign-up, loads instantly

> Free hosting, so it sleeps after 15 minutes idle. A cold first visit takes
> 30–50 seconds to wake up.

Pick any goal. Playbook researches what you are actually chasing, builds a plan
backwards from it using what you already have, then goes and finds real
opportunities that move the step you are on right now. Finish something, log it,
and it decides whether you are ready for the next step.

---

## How it works

```
Onboarding      a resume and three questions, once
      ↓
Your goal       four fields: what, how you would know, by when, what limits you
      ↓
Brief           researched off the live web. What this target is, how it
                actually works, who gets in, what it rewards
      ↓
Plan            steps working backwards from your deadline. Every step names
                the specific advantage it uses
      ↓
Leverage nodes  what each step should go looking for — people, communities,
                programs, things to build, open doors
      ↓
Scan            searches the web against the current step only. Real programs,
                real links, real deadlines
      ↓
Opportunities   you tick what you will actually do. The rest is set aside
      ↓
Step review     you log what happened. It reads only that evidence and decides:
                advance, stay, or not enough yet
      ↓
                next step becomes current, and it scans again
```

You approve five of those. Nothing moves on its own.

### For example

Someone wants into a top engineering school through early decision.

The brief comes back with how that school's ED round actually works this cycle
and what it rewards. The plan puts *"turn your existing robotics code into a kit
other teams can use"* first — not because that is generic good advice, but
because their resume says they already wrote it and it is sitting unused.

The scan then finds live things for that one step: a student ambassador program
with open Q&A slots, a club whose members review public-equity pitches, an alumni
network with a real contact route. Each with a link, a deadline, and the first
message to send.

They do one. They log it. The system decides whether that was enough.

---

## Try it

**Start with [the demo](https://playbook-e8xd.onrender.com/demo)** — six stages
of a real run, already generated, annotated as you click through. About a minute.

Then sign up and run your own goal. Every stage is live: real web search, real
research. Building a plan takes a few minutes, which is why the demo exists.

---

## What is next

Nothing here is hypothetical — it is what the tool needs to stop being a good
first draft.

**Editing.** Right now you can approve what gets generated or regenerate it.
You cannot fix it. If a constraint changes halfway through, you should be able
to edit the plan, a step, or a single opportunity, and have everything downstream
respect it.

**Memory that builds.** Onboarding is a resume and three questions, which is
thin. It should get to know you over time — you add context as you go, and every
plan and scan gets sharper because it understands more of your life. The profile
is the thing that makes any of this personal, so it is the thing most worth
deepening.

**Scheduled scans.** Today you scan a step once and work from that batch.
Weekly scans would keep opportunities arriving as deadlines open and close,
rather than freezing your options at whatever existed the day you started.

**Better onboarding.** Uploading a resume is the lowest-friction thing that
works, not the right thing.

**Settings.** You cannot currently edit your own profile at all.

**Quality.** Sharper scans, better plans. That is prompt work, and it comes
after the structural pieces.

---

## Time spent

Around **10 hours**. Roughly a third on the domain model and the state machine,
a third wiring live AI, accounts and the database, and the rest on the interface,
the demo, and spend guards.

---

## Running it locally

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

`supabase/migrations/0001_init.sql` creates the tables and their policies — paste
it into the Supabase SQL editor.

**No API key?** Set `PLAYBOOK_PROVIDER=mock`. Every stage returns a fixture and
the whole loop still works.

```bash
npm run check:all     # state machine, review flow, spend policy
npm run map           # a browsable page of the codebase
```

---

## How it is put together

This ran as a file system before it was an app. The whole loop lived in an
Obsidian vault — Markdown as the source of truth, TypeScript scripts for every
state change, prompts and JSON schemas in folders, an index rebuilt by parsing
tags out of notes. It worked, for one person who knew where everything was.

Rebuilding it as an app meant keeping the process and throwing away the
accidents. The prompts and the object contract came across almost intact. The
Markdown parsing, the hand-maintained tags and the regenerated index simply
stopped existing — in a typed model, *"all the steps in this plan"* is
`plan.steps`.

**The rule everything is built around: the AI never changes state.** It returns
proposals. Deterministic code validates them, assigns every id, and applies them
only at a gate you approved. That is why the model can be swapped, mocked, or
plain wrong without corrupting anything.

Feature-based layout — one folder per screen, owning its own server actions and
components:

```
src/core/       the nouns, the rulebook, saving, the health check
src/ai/         six stages behind one interface (openai / codex / mock)
src/features/   onboarding, goal, brief, plan, nodes, scan, opportunities, review
src/app/        routes, thin
supabase/       schema and row-level security
```

[ARCHITECTURE.md](ARCHITECTURE.md) has the detail. The part worth reading is
what each AI stage is allowed to see — two of the six are deliberately blind to
your profile, enforced by not passing the data rather than by asking the model
nicely.

[ROADMAP.md](ROADMAP.md) is the longer version of what is next.
