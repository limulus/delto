---
id: ∆hIw
serves:
  - readable-backlog
written: 2026-09-19
commit: 2633dad
---

# `mint` treats ids as taken case-insensitively

## Value

The overseer can name an item out loud, for example "delta C T B", and it can only mean one
item.

## Background

The spec allows loose human references ("delta for F6" may mean `∆4f6` or `∆4F6`), and that
only works while no two ids differ in case alone. On 2026-09-19 `mint` issued `∆ctb` while
`∆CTB` exists in the journal.

## Serves

- `readable-backlog`: the overseer can refer to any item without ambiguity.

## Scope and constraints

- `mint` never issues an id that matches an existing one when case is ignored. Ids minted
  together with `--count` are distinct from each other in the same way.
- Existing ids stay valid, including any existing pair that differs only in case.
- The alphabet is unchanged. Decided 2026-09-19: look-alike characters (`I`, `l`, `1`, `O`,
  `0`) stay, because a monospace font tells them apart and backticks put ids in one.
- `fix:` commit. Not adopter-facing.

## Implementation suggestions

- Compare lower-cased ids in the taken set in `src/lib/mint.ts`.
- A `lint` check for existing case-only pairs is a possible follow-up, not part of this.
