---
id: ∆HQN
completed: 2026-05-31 06:45:27 +00:00
---

## Backlog item

> - ∆HQN Document the complete-before-prune ordering in the `/delto` SKILL.md `## Committing`
>   workflow — `delto complete` must run while the item is still in BACKLOG.md (it transcribes
>   the bullet), then remove the bullet. Surfaced by the ∆yNQ journal review.

## Planning

The item assumed a `## Committing` section in `SKILL.md`, but there isn't one — the complete
workflow lives in the `### complete` subsection under `## User request`, and the tool itself
is described under `#### complete`. Rather than invent a new top-level section that would
compete with the existing complete guidance, I documented the ordering where readers already
look: the `### complete` workflow (the procedure) plus a one-clause reminder in the `#### complete`
tool reference (the contract).

## Refinement

Two edits. The tool reference now states that `complete` transcribes the bullet from
`BACKLOG.md` and never edits the backlog itself, "so run it while the bullet is still present."
The workflow subsection adds an "Order matters" paragraph: run `complete` while the item is
still in `BACKLOG.md`, fill the entry, then remove the bullet — doing it the other way leaves
`complete` with nothing to transcribe. Pure docs; no code or tests touched, so the coverage
gate is unaffected.

## Retrospective

This ordering is exactly the trap I'd have hit completing these very items tonight, so it was
worth writing down plainly. Folding it into the existing `### complete` section instead of a
new `## Committing` heading keeps the skill's prose-only shape (ADR-001) tight rather than
growing parallel sections that say overlapping things.
