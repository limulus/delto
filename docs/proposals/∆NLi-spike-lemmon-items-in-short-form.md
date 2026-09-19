---
id: ∆NLi
serves:
  - ∆YQb
written: 2026-09-19
commit: 2633dad
---

# Spike: lemmon's items in the short form

## Value

The author of ADR-002 (`∆YQb`), and later `∆VyU`. The short item format was designed by
discussion. Before other items build on it, this spike tests it on real items that are known
to be too technical: the backlog of github.com/limulus/lemmon, whose maintainer finds it
hard to read at a glance.

## Serves

- `∆YQb`: the findings decide what a proposal must carry and whether the two-line cap is
  realistic, which the ADR records.

## Scope and constraints

- Sample lemmon's `BACKLOG.md` across kinds of item: a feature with heavy technical detail
  (lemmon's `∆4tG`, `∆PgF`), one carrying a binding constraint (lemmon's `∆pP5`: a photo's
  URL is its stored alias, never recomputed), a defect (lemmon's `∆3oX`), and an item with
  many dependencies (lemmon's `∆MlD`).
- For each, write the one-sentence item and the proposal, and note anything that had no
  place to go.
- Questions to answer: can one sentence carry both the value and the change; are the four
  proposal sections enough; is a two-line cap realistic; do binding constraints separate
  cleanly from suggestions; does a defect's proposal come out as filler.
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
    the user sees. File and function names moved to the proposals without loss.
  - Eight of the nine `serves` links between items mirror a needs edge in reverse. The
    exception, `∆mzU` serving `∆vvd`, is a benefit that is not a hard prerequisite.
  - Groundwork items with several `serves` targets (`∆YQb`, `∆Wak`) trace to almost every
    outcome, which tells the overseer little. Consider listing only the nearest
    beneficiaries, and showing the chain (`∆iXR`), not the flattened set of outcomes.
- Have a fresh agent produce the short forms from the long ones as well, as a preview of
  `∆VyU`'s eval.
