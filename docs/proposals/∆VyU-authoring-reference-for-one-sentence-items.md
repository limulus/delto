---
id: ∆VyU
serves:
  - readable-backlog
written: 2026-09-19
commit: 2633dad
---

# Authoring reference for one-sentence items

## Value

When an agent adds an item, the overseer can read it in one pass and understand what they
will get and roughly what will change.

## Background

lemmon's backlog shows what happens under the current guidance: items go so deep into
implementation that its maintainer cannot read them at a glance.

## Serves

- `readable-backlog`: agents write items a human can read quickly.

## Scope and constraints

- Rewrite `skills/delto/references/authoring-backlog-items.md`. An item is one
  plain-language sentence that conveys the value the user gets and, at a very high level,
  what changes.
- Teach a sentence pattern with examples: "value, because change" or "change, so value". A
  bare length limit gets stretched with semicolons and dashes.
- At most two wrapped lines, suffix included. `lint` enforces it through its line cap.
- Plain language: no file names, function names, or decision numbers in the item. They go
  in the proposal (`∆z3V`), along with everything else.
- Duplicate check (decided 2026-09-19): compare the new item with existing item text, and
  open an existing item's proposal only where that text suggests significant overlap. This
  keeps `add` cheap as a backlog grows.
- The starter header template states the new cap in place of "items 5 lines max".
- Eval by the methodology in `docs/experiments/`, with lemmon-style rough descriptions as
  input and prompts that are novel against the target backlog. Include one true duplicate
  worded differently from the existing item, to learn whether one-sentence text carries
  enough signal for the duplicate check.
- `∆gmz`, `∆2hh`, and `∆IUb` change the same file. Keep what they shipped; if they have not
  shipped, they apply to the rewritten file.
- Adopter log entry (`∆uTy`): the migration shortens items and moves their detail into
  proposals. It needs judgment; it is not mechanical.

## Implementation suggestions

- Use before/after pairs from the `∆NLi` write-up as the reference's examples.
