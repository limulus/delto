---
id: ∆LNK
serves:
  - lessons-kept
written: 2026-09-19
commit: 2633dad
---

# `complete` carries the proposal into the journal

## Value

Readers of the journal, including `distill`. A journal entry transcribes the item's bullet.
With one-sentence items the bullet no longer records why the work was done or what bound
it; the proposal does. Value chains that pass through a completed item also need something
that still exists to point at.

## Serves

- `lessons-kept`: the record of completed work keeps the reasons for it.

## Scope and constraints

- `complete` locates the item's proposal (`∆Wak`), and the resulting journal entry includes
  or absorbs it, as ADR-002 (`∆YQb`) decides.
- No proposal is left behind for a completed item.
- An item with no proposal, as in a project that has not adopted proposals, completes as
  it does today.
- The `complete` action in `SKILL.md` and the journal README template follow.
- Retiring an item (`∆Af6`) takes the same path.

## Implementation suggestions

- If ADR-002 chooses the move option: move the proposal to the journal path, add
  `completed` to its frontmatter, and append the Planning, Refinement, and Retrospective
  sections. The shared filename means no slug has to be chosen at completion.
