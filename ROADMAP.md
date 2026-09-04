# Roadmap

Running list. Add to it whenever something gets deferred, tick things off as
they land. Newest thinking wins. This file is meant to be edited.

**Where it stands:** the whole loop runs live, on real accounts, against a real
database, and it's deployed. See [README.md](README.md).

---

## 1. Editing what gets generated

The biggest gap, and one the original system had already flagged before this
rebuild started. Right now you can approve a brief or regenerate it. You can't
fix it.

- [ ] Inline edits on brief fields, plan steps, and leverage node phrases.
- [ ] An edit should create a revision rather than overwrite, so regenerating
      never quietly eats a correction.
- [ ] Say what's wrong, get a proposed diff, approve or reject it. Same
      proposal-and-gate shape as everything else.
- [ ] Decide whether that's one control or one per artifact.

## 2. Scan quality

Half done. The per-category guidance is back in the prompt, and results say what
they are rather than which lane found them. The rest isn't.

- [ ] Cut verbosity while keeping enough for promotion and later reasoning.
- [ ] Separate "make this" from "apply to this" more sharply than the three
      result types manage right now.
- [ ] Push `standard_programs` and `direct_opportunities` harder toward things
      with an actual application route.
- [ ] Retune the broad-versus-local balance against a goal that's not a
      university application.

## 3. The gaps from building it

- [ ] **Deferred results go nowhere.** You can mark one "Later" and never see it
      again.
- [ ] **No history.** Past scans, dropped opportunities and old reviews are all
      stored and none of them are shown.
- [ ] **Regeneration replaces rather than versions.** `plan-v2` is supported by
      the types and never produced.
- [ ] **Skipped steps.** The status exists; nothing sets it.
- [ ] No pause, archive or delete from the interface.
- [ ] Onboarding extracts text from an uploaded PDF and throws the file away.
      Keeping it would allow re-parsing later.

## 4. The daily layer

The original idea was "new tasks every day". Nothing in the current design does
that, and it would be an addition rather than a missing piece. Steps are
month-scale, opportunities are things you picked, and neither one is a daily
task.

- [ ] Decide whether daily items get derived fresh each morning or stored and
      checked off. Derived can't drift. Stored is what lets you look back.
- [ ] A morning view that's not the whole workspace.
- [ ] Only then: scheduling, reminders, notifications.

## 5. Richer personal context

Onboarding builds a profile from a resume and three questions, which is thin
next to the compiled history the original system ran on.

- [ ] Import a generated Personal Leverage Map through the existing
      `PersonalContextProvider` slot, it was designed for exactly this.
- [ ] Keep source links so a plan can cite where a claim came from.
- [ ] `plan.profileHash` already gets stored. Use it to spot when a plan was
      built from a version of you that has since moved on, and offer a re-plan.

## 6. Scheduled scans

- [ ] A weekly scan per active goal, once quality is worth automating.
- [ ] Due-state and locking belong in the app rather than in a scheduler. The
      Obsidian version learned that the hard way.

## 7. Before it's genuinely public-facing

- [ ] Swap the demo fixture for a fully synthetic run. Private names are already
      replaced, but the school and its details remain.
- [ ] Real tests around the transition logic, beyond the three check suites.
- [ ] Long calls hold an HTTP connection for up to three minutes. Fine on a
      plain Node host. If that ever stops being true, background mode plus
      polling is the right fix.
- [ ] The free Render tier sleeps after fifteen minutes.

---

## Settled, so it doesn't come back

- **Nested requirement checklists under steps.** Tried in the original system
  and discarded. Steps are judged, not ticked off.
- **Auto-promoting scan results.** Every promotion stays an explicit choice.
- **Letting the AI write state.** It proposes; code applies.
- **Broad Brief.** A separate product. Its discovery architecture must not
  redefine this one.

## Closed by the rebuild

Two whole tracks from the original list stopped existing rather than getting
finished:

- **Object index and structure.** The old system hand-tagged Markdown and
  rebuilt a JSON index so commands could ask for "all steps in this plan". Here
  that question is just `plan.steps`. Nothing to keep in sync, and the regex
  parsers that used to lose completed steps can't exist. Only the validation
  half survived, as `src/core/validate.ts`.
- **An app-like interaction layer.** That's the whole thing now.
