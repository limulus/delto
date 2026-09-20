---
id: ∆NLi
serves:
  - ∆YQb
---

# Spike: lemmon's items in the short form

## Value

delto's maintainer finds out whether one-sentence items work on a real backlog that is
known to be hard to read. They learn this before more work builds on the format, along with
what a brief has to hold for nothing to be lost.

## Background

The format was designed in discussion and has not been tried on items written by someone
else. The backlog of github.com/limulus/lemmon is the test case: its items go so deep into
implementation that its maintainer cannot read them at a glance. The findings feed ADR-002
(`∆YQb`) and the authoring reference (`∆VyU`).

## Serves

- `∆YQb`: the findings decide what a brief must carry and whether the two-line cap is
  realistic, which the ADR records.

## Scope and constraints

- Sample lemmon's `BACKLOG.md` across kinds of item: a feature with heavy technical detail
  (lemmon's `∆4tG`, `∆PgF`), one carrying a binding constraint (lemmon's `∆pP5`: a photo's
  URL is its stored alias, never recomputed), a defect (lemmon's `∆3oX`), and an item with
  many dependencies (lemmon's `∆MlD`).
- For each, write the one-sentence item and the brief, and note anything that had no
  place to go.
- Questions to answer: can one sentence carry both the value and the change; are the
  brief's sections enough; is a two-line cap realistic; do binding constraints separate
  cleanly from suggestions; does a defect's brief come out as filler.
- The measure is whether lemmon's maintainer finds the result readable. An agent's opinion
  of readability does not count.
- Output: a write-up in `docs/experiments/` with the before/after pairs. No change to the
  lemmon repo.

## Implementation suggestions

- The 18 items of delto's "Short readable items" initiative were rewritten this way on
  2026-09-19 (this directory). Count them as a second sample. What that pass found:
  - "Value, because change" fit every item within two lines. The spike and the ADR fit
    least well, because what they deliver is knowledge or a decision.
  - Command names (`surface`, `mint`, `plan`) stayed in the sentences, since they are what
    the user sees. File and function names moved to the briefs without loss.
  - Eight of the nine `serves` links between items mirrored a needs edge in reverse. The
    exception was a benefit that was not a hard prerequisite (`∆mzU` then served `∆vvd`;
    that link went when the scaffold command was dropped).
  - Groundwork items with several `serves` targets (`∆YQb`, `∆Wak`) trace to almost every
    outcome, which tells the overseer little. Consider listing only the nearest
    beneficiaries, and showing the chain (`∆iXR`), not the flattened set of outcomes.
  - The first draft of every Value section described a problem and argued for the work,
    and none said what the beneficiary gains. The maintainer found them hard to read. The
    fix was a plain value statement from the beneficiary's side, with the problem and the
    reasoning moved to a separate Background section.
    The files were still called proposals then, which may have invited the arguing.
- Have a fresh agent produce the short forms from the long ones as well, as a preview of
  `∆VyU`'s eval.
