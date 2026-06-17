---
id: ∆WyS
completed: 2026-06-16 20:10:59 -07:00
---

## Backlog item

> - ∆WyS Make the `/delto` `add` action reliably read the authoring reference — agents skip
>   `skills/delto/references/authoring-backlog-items.md` because SKILL.md mentions it only as a
>   trailing aside, so items get authored from memory and come out subtly wrong (missing why,
>   poor placement, bogus `needs:`). Strengthen the `add` section so reading it first is a hard
>   prerequisite, not a suggestion.

## Planning

The fix was always going to be prose in one place — `SKILL.md`'s `### add` section — so
planning was mostly about scope discipline and framing, not design.

- **Scope held tight against [[∆GJ3]].** ∆WyS is only "get the agent to *read* the
  reference once authoring is underway"; the sibling ∆GJ3 covers the agent *performing*
  the request instead of adding an item. Kept the edit to the read-gate and left routing
  alone.
- **Diagnosis over restyling.** The old section buried the reference link as the last
  clause of the last sentence — an agent has already "got the gist" (mint + write from the
  user's text) before it reaches a trailing link, so it authors from memory. The fix moves
  the read instruction to the front as a hard gate, frames it as "a hard prerequisite, not
  a suggestion" (the item's own words), names the failure mode so the stakes of skipping
  are explicit, and folds the `mint` mention into "follow it" so there's one authority
  instead of a competing summary that invites skipping the doc.
- **Grounded in evidence.** [[∆Xtj]]'s eval (`docs/experiments/authoring-reference-eval.md`)
  already proved the reference lifts item quality most in exactly the dimensions ∆WyS
  names — *why*, placement, self-containment — but it *inlined* the reference for the
  treatment cell. In production it's a linked file the agent must choose to open, so a
  proven reference is worthless unread. That made the value concrete, not speculative.

## Refinement

Implementation was a single `Edit`. Two notes: the first `Edit` failed because the path I'd
Read during planning was the installed `~/.claude/skills/...` copy, not the repo's
`skills/delto/SKILL.md` — same bytes, but the harness tracks file state per path, so I had
to Read the repo copy first (`.claude/skills/delto` is a dogfooding symlink per ADR-001, so
one edit covers both). Lint passed but only scopes to `*.ts src`; markdown prose isn't
linted, and no test asserts on this wording (verified by grep before editing).

## Retrospective

Small change, but the leverage is real: an unread reference is dead weight, and [[∆Xtj]]
had already paid to prove this one earns its tokens. The honest limitation is that I can't
measure whether the gate actually changes read-behavior without an eval like ∆Xtj's — this
ships on the same argument-alone basis that bdf1c03 originally shipped the reference on.
Worth a future A/B (link-as-aside vs. leading gate) if `add` quality regresses; the harness
from ∆Xtj lifts nearly verbatim.
