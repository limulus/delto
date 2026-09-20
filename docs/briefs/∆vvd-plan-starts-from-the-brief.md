---
id: ∆vvd
serves:
  - agent-ready-work
---

# `plan` starts from the brief

## Value

An agent planning an item starts with what the item's author knew, and the plan it produces
still fits the code as it is now.

## Background

The brief was written when its author held the context; the plan is written against the
code as it is at planning time. Planning should use the first without being misled by it.

## Serves

- `agent-ready-work`: an agent starting cold gets the author's context and still plans
  against current code.

## Scope and constraints

- The `plan` action reads the item's brief before anything else.
- Scope and constraints are binding on the plan.
- Implementation suggestions are optional. Planners tend to adopt a suggestion even when it
  is labelled optional, so the action says: check each one against the current code before
  adopting it, and drop what no longer fits. To judge how stale a brief is, ask git when it
  last changed and what has changed in the code since. `distill` applies the same rule to
  journal claims.
- A brief never replaces the planning phase. A full plan is still produced just before
  implementation.
- If planning shows that the brief's value claim or scope is wrong, correct the brief,
  or raise retiring the item, and do not plan around the error.
- An item with no brief, as in a project that has not adopted briefs, is planned as
  it is today.

## Implementation suggestions

- `surface` or `claim` could print the brief's path to save the planner a lookup.
