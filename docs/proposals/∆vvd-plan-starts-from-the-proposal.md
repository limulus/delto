---
id: ∆vvd
serves:
  - agent-ready-work
written: 2026-09-19
commit: 2633dad
---

# `plan` starts from the proposal

## Value

The planning agent, and through it the overseer. The proposal was written when its author
held the context; the plan is written against the code as it is now. Planning should use
the first without being misled by it.

## Serves

- `agent-ready-work`: an agent starting cold gets the author's context and still plans
  against current code.

## Scope and constraints

- The `plan` action reads the item's proposal before anything else.
- Scope and constraints are binding on the plan.
- Implementation suggestions are optional. Planners tend to adopt a suggestion even when it
  is labelled optional, so the action says: check each one against the current code before
  adopting it, use the proposal's `written` and `commit` fields to judge how stale it is,
  and drop what no longer fits. `distill` applies the same rule to journal claims.
- A proposal never replaces the planning phase. A full plan is still produced just before
  implementation.
- If planning shows that the proposal's value claim or scope is wrong, correct the proposal,
  or raise retiring the item, and do not plan around the error.
- An item with no proposal, as in a project that has not adopted proposals, is planned as
  it is today.

## Implementation suggestions

- `surface` or `claim` could print the proposal's path to save the planner a lookup.
