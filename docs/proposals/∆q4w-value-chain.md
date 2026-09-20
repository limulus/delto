---
id: ∆q4w
serves:
  - informed-approval
written: 2026-09-19
commit: 2633dad
---

# Value chain

## Value

The overseer can ask of any item "what is this for?" and follow the answer up to one of the
project's outcomes. Work that leads to no outcome stands out.

## Background

The question matters most when circumstances have changed since an item was filed: the chain
is what shows whether the work is still worth doing.

## Serves

- `informed-approval`: the overseer can see what a piece of work is for before approving it.

## Scope and constraints

- Every proposal's frontmatter names what its value serves: another item, or a top-level
  outcome. An item's value may be to another component, but its chain must end at an
  outcome.
- An agent can justify a link from any item to any outcome. The chain is only useful if it
  is structured, checked, and seen by a human. This item makes it structured and checked;
  `∆iXR` shows it to the human.
- `delto lint` verifies that every `serves` target resolves (a live item, a completed item
  as ADR-002 decides, or an outcome), that every chain ends at an outcome, and that there
  are no cycles.
- The proposal body gives one sentence per link saying why it holds. A contrived link is
  easier to notice when it has to be justified in a sentence.
- The writing reference says that a chain of more than about three hops deserves a second
  look.
- How `serves` relates to the needs graph follows ADR-002 (`∆YQb`).
- Deliverables: spec text, writing-reference guidance, the scaffold field (`∆mzU`), the
  `lint` check, and an adopter log entry (`∆uTy`).

## Implementation suggestions

- Reuse the cycle detection in `src/lib/lint.ts`.
