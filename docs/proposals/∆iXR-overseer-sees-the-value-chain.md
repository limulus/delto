---
id: ∆iXR
serves:
  - informed-approval
written: 2026-09-19
commit: 2633dad
---

# The overseer sees an item's value chain

## Value

The overseer. Planning is where they decide whether work is worth the effort, and the chain
may have gone stale since the item was filed: an outcome reworded, the item it serves
retired. Filing is the cheapest moment to reject a contrived link, because the overseer is
already present.

## Serves

- `informed-approval`: the overseer judges an item's value from the files themselves, before
  approving the plan.

## Scope and constraints

- A CLI command prints the chain for a deltoid: one line per hop with the id and its value
  statement, ending with the outcome's text.
- The output is read from the files. The agent wrote the link, so its own summary of the
  link is not independent evidence.
- The `plan` action puts the command's output at the top of every plan. The `add` action
  shows it when the item is filed.
- `--help` is the contract (ADR-001). A `--json` form, as `surface` has.
- Not in this item: a whole-backlog view grouped by outcome, showing which outcomes have no
  work. That belongs with `∆Stb` (`delto status`).

## Implementation suggestions

- `trace` is a candidate name for the subcommand.
- Where a proposal lists several `serves` targets, print a tree.
