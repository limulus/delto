---
id: ∆Ace
completed: 2026-06-11 21:28:53 -07:00
---

## Backlog item

> - ∆Ace Add a `references/` guide to the `/delto` skill on writing good backlog items —
>   progressive disclosure, kept out of `SKILL.md` and loaded on demand: terse phrasing,
>   written for a reader with no prior context, the "why" not just the what, and using a
>   subagent to evaluate a new item's `needs:` against the rest of the backlog. Restores and
>   improves the add-item guidance dropped in the ∆Rnm cutover.

## Planning

The work began as writer's block on an empty `references/authoring-backlog-items.md`.
Recovering the pre-∆Rnm `add-backlog-item/SKILL.md` from Git history (`git show
3c635c5^:skills/add-backlog-item/SKILL.md`) broke the block — it supplied the proven
mechanics (mint first, Initiative→Epic placement, append-by-default, what-not-design,
terseness), while the ∆Ace item text supplied what was new: the no-prior-context reader,
the "why" requirement, and the subagent `needs:` evaluation.

Legacy material deliberately dropped: `touches:` (not in the spec v1.0), the linter
verification step (parked as ∆PZ3), and repo-specific paths/limits — the guide is
distributable, so it defers to each backlog's self-documented conventions instead of
hardcoding "5 lines max."

## Refinement

The guide gained two things neither source asked for: the prerequisite-vs-sequencing
distinction ("would be nicer afterwards" is not a `needs:`, and a bogus edge hides
eligible work from `surface`), and duplicate detection as a third subagent report item
(a near-duplicate means refining the existing item, not adding one). The framing device —
"a backlog item is a promise to a future reader" — replaced a rule list with one principle
the other guidance falls out of.

Adjacent docs updated alongside: the README's "Working with delto" list gained a
`/delto add` bullet now that `add` is a named action in `SKILL.md`, and ADR-001 §2 was
revised to say prose detail splits into `references/` guides (the convention this item
established) rather than "sibling `.md` files."

## Retrospective

Mining Git history for the ∆Rnm-deleted skill was the unlock — the backlog item's
"restores and improves" phrasing was effectively a pointer to a first draft that already
existed. When an item references dropped work, recovering it should be the first move, not
a fallback. Deferred: guidance on when *not* to add an item (work small enough to just do)
was considered and left out; worth a future item if the gap shows up in practice.
