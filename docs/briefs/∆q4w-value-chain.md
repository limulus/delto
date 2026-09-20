---
id: ∆q4w
serves:
  - informed-approval
---

# Value chain

## Value

The overseer can ask of any item "what is this for?" and follow the answer up to one of the
project's top-level benefits. Work that benefits no one stands out.

## Background

The question matters most when circumstances have changed since an item was filed: the chain
is what shows whether the work is still worth doing.

## Serves

- `informed-approval`: the overseer can see what a piece of work is for before approving it.

## Scope and constraints

- Every brief's frontmatter names what its value serves: another item, or a top-level
  benefit. An item's value may be to another component, but its chain must end at a
  top-level benefit.
- An agent can justify a link from any item to any top-level benefit. The chain is only
  useful if it is structured, checked, and seen by a human. This item makes it structured
  and checked; `∆iXR` shows it to the human.
- `delto lint` verifies that every `serves` target resolves (a live item, a completed item
  as ADR-002 decides, or a top-level benefit), that every chain ends at a top-level
  benefit, and that there are no cycles.
- The body of the brief gives one sentence per link saying why it holds. A contrived link is
  easier to notice when it has to be justified in a sentence.
- The writing reference says that a chain of more than about three hops deserves a second
  look.
- How `serves` relates to the needs graph follows ADR-002 (`∆YQb`).
- `delto lint` also verifies that every live item has a brief, that the brief's filename
  matches its id, that its frontmatter parses, and that its required sections are present.
  No command generates briefs, so this check is what keeps them well-formed, whoever
  wrote them.
- Deliverables: spec text, writing-reference guidance, the `lint` checks, and an adopter
  log entry (`∆uTy`). The `serves` field is already in the brief template (`∆z3V`, `∆mzU`);
  this item makes it required and checked.

## Implementation suggestions

- Reuse the cycle detection in `src/lib/lint.ts`.
