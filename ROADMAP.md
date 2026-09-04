# Roadmap

Running list. Add to it whenever something gets deferred; tick things off as
they land. Newest thinking wins — this file is meant to be edited.

**Where it stands:** the whole loop runs live, on real accounts, against a real
database, deployed. See [README.md](README.md).

---

## 1. Editing what gets generated

The largest gap, and the one the original system had flagged before this rebuild
started. Right now you can approve a brief or regenerate it. You cannot fix it.

- [ ] Inline edits on brief fields, plan steps, and leverage node phrases.
- [ ] An edit creates a revision rather than overwriting, so regeneration never
      silently eats a correction.
- [ ] Feedback-driven revision: say what is wrong, get a proposed diff, approve
      or reject it. The same proposal-and-gate shape as everything else.
- [ ] Decide whether that is one control or one per artifact.

## 2. Scan quality

Partly addressed — the per-category guidance is back in the prompt, and results
say what they are rather than which lane found them. The rest is unfinished.

- [ ] Cut verbosity while keeping enough for promotion and later reasoning.
- [ ] Separate "make this" from "apply to this" more sharply than the three
      result types manage today.
- [ ] Push `standard_programs` and `direct_opportunities` harder toward things
      with an actual application route.
- [ ] Retune the broad-versus-local balance against a goal that is not a
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

The original vision was "new tasks every day". Nothing in the current design
does this, and it is an addition rather than a missing piece: steps are
month-scale, opportunities are things you chose, and neither is a daily task.

- [ ] Decide whether daily items are derived fresh each morning or stored and
      checkable. Derived cannot drift; stored is what lets you look back.
- [ ] A morning view that is not the whole workspace.
- [ ] Only then: scheduling, reminders, notifications.

## 5. Richer personal context

Onboarding builds a profile from a resume and three questions. The system it
came from used a far richer compiled history.

- [ ] Import a generated Personal Leverage Map through the existing
      `PersonalContextProvider` slot — it was designed for exactly this.
- [ ] Keep source links so a plan can cite where a claim came from.
- [ ] `plan.profileHash` is already stored; use it to notice when a plan was
      built from a version of you that has moved on, and offer a re-plan.

## 6. Scheduled scans

- [ ] A weekly scan per active goal, once quality is worth automating.
- [ ] Due-state and locking belong in the app, not in a scheduler. The Obsidian
      version learned that the hard way.

## 7. Before it is genuinely public-facing

- [ ] Swap the demo fixture for a fully synthetic run. Private names are already
      replaced, but the school and its details remain.
- [ ] Real tests around the transition logic, beyond the three check suites.
- [ ] Long calls hold an HTTP connection for up to three minutes. Fine on a
      plain Node host; OpenAI's background mode plus polling would be the
      correct fix if that ever stops being true.
- [ ] The free Render tier sleeps after fifteen minutes.

---

## Settled, so it does not come back

- **Nested requirement checklists under steps.** Tried in the original system
  and discarded. Steps are judged, not ticked off.
- **Auto-promoting scan results.** Every promotion stays an explicit choice.
- **Letting the AI write state.** It proposes; code applies.
- **Broad Brief.** A separate product. Its discovery architecture must not
  redefine this one.

## Closed by the rebuild

Two whole tracks from the original list stopped existing rather than getting
done:

- **Object index and structure.** The old system hand-tagged Markdown and
  regenerated a JSON index so commands could ask "all steps in this plan". Here
  that question is `plan.steps`. There is no index to keep in sync, and the
  regex parsers that used to lose completed steps cannot exist. What survived is
  the validation half, as `src/core/validate.ts`.
- **An app-like interaction layer.** That is the whole thing now.
