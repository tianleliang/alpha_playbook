# Playbook

Turns one goal into a plan built on what you already have, then keeps finding
real outside opportunities that move the current step forward.

Local-only. Your data lives in `data/` as plain JSON. Nothing leaves your machine.

## Run it

```bash
npm run dev
```

Then open <http://localhost:3000>.

First visit sends you to onboarding. Paste a resume (or upload a `.pdf`/`.txt`/`.md`),
answer three short questions, and you land on the goal box.

## The other commands

```bash
npm run check
```

Verifies every relationship in your saved projects still holds, then deliberately
breaks copies five ways to prove the checker actually fires.

```bash
npm run map
```

Regenerates `.map/codebase.html`, a self-contained browser for the whole codebase.

```bash
npm run build
```

Production build. Useful as a full type and route check.

## Start over

Delete `data/` and reload. That wipes your profile and every goal.
To reset just one goal, delete its file from `data/projects/`.

## Right now everything is fake

The five AI stages return fixtures, not real answers. There is a **Demo data**
chip in the header wherever that is true, and anywhere a real provider would
cite a source you will see `example.com`. Nothing invented is dressed up as real.

Swapping in the real thing is one file — see [ROADMAP.md](ROADMAP.md).

## Where things are

```
src/
  core/       the nouns, the rulebook, saving, the health check
  ai/         the six AI stages behind one interface
  features/   one folder per screen
  app/        routes, ~20 lines each
data/         your saved state (gitignored)
```

[ARCHITECTURE.md](ARCHITECTURE.md) explains how it fits together.
