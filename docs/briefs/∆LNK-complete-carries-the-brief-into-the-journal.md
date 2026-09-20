---
id: ∆LNK
serves:
  - lessons-kept
written: 2026-09-19
commit: 2633dad
---

# `complete` carries the brief into the journal

## Value

Someone reading the journal later finds out why a piece of work was done and what
constrained it, not only that it was done.

## Background

A journal entry transcribes the item's bullet. With one-sentence items the bullet no longer
records why the work was done or what bound it; the brief does. `distill` reads the
journal too. Value chains that pass through a completed item also need something that still
exists to point at.

## Serves

- `lessons-kept`: the record of completed work keeps the reasons for it.

## Scope and constraints

- `complete` locates the item's brief (`∆Wak`), and the resulting journal entry includes
  or absorbs it, as ADR-002 (`∆YQb`) decides.
- No brief is left behind for a completed item.
- An item with no brief, as in a project that has not adopted briefs, completes as
  it does today.
- The `complete` action in `SKILL.md` and the journal README template follow.
- Retiring an item (`∆Af6`) takes the same path.

## Implementation suggestions

- If ADR-002 chooses the move option: move the brief to the journal path, add
  `completed` to its frontmatter, and append the Planning, Refinement, and Retrospective
  sections. The shared filename means no slug has to be chosen at completion.
