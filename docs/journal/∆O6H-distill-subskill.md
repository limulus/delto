---
id: ∆O6H
completed: 2026-07-06 20:56:51 -07:00
---

## Backlog item

> - ∆O6H `distill` subskill — review journal entries added since a commit-SHA watermark
>   (kept in the journal README, advanced with the instructions-file edits) and fold durable
>   lessons into the project's agent instructions file (`CLAUDE.md`, `AGENTS.md`, …),
>   verifying each claim against current code first, so retrospective lessons reach future
>   sessions instead of staying buried. Proven manually on menschen 2026-07-01

## Planning

Generalized the manual pass proven on menschen ([[∆Hp7]]'s substrate; its commit
`b558d67` and journal-README watermark section were the concrete precedent). Shape follows
the `add` pattern: a `### distill` action in `SKILL.md` with a hard read-gate pointing at a
new `references/distilling-journal-entries.md`, which carries the whole procedure —
watermark location and template, the review-set listing, durable-vs-not criteria,
verify-every-claim-against-current-code, prune superseded guidance, advance the watermark
in the same commit as the instructions edits. Deliberately no CLI change: the only
deterministic step is a one-line listing that lives fine as a snippet in the reference,
per ADR-001's primitives-vs-judgment split. Verification plan was a dogfood run on this
repo's own 30 entries, which also produced `docs/journal/README.md` as template source
for ∆Tmp.

## Refinement

The dogfood run worked (three subagents reviewed the entries; the verify step caught real
drift, e.g. an `io.ts` path that had moved and a superseded minimal-deps claim), but it
exposed a design flaw in the item as filed: the **commit-SHA watermark dangles**. The
first watermark referenced the SHA of the sibling feat commit; when both commits were
reset for review, that SHA pointed at discarded history — and any SHA recorded before
history is final (reset, amend, rebase, squash-merge) fails the same way. Switched the
convention to a **datetime watermark** compared against each entry's spec-mandated
`completed` frontmatter: zero git dependence, survives history rewrites and shallow
clones, degrades to a rare near-boundary miss that the reference mitigates with a
"review anything near the boundary" rule. Anchoring to the newest entry's commit SHA was
considered and rejected — entries and distillation often travel in the same branch, so it
re-creates the dangling reference one step removed. menschen's README still uses the SHA
convention; port it at that repo's next distillation.

Also trimmed the skill description's trigger clause to "distilling journal lessons into
agent memory" — vendor-neutral (no `CLAUDE.md`/`AGENTS.md` in the description) and short,
with the concrete filenames kept in the loaded prose where they cost nothing.

Acceptance review also fixed the commit typing: the skill commit was first typed
`feat(skill)`, but `skills/` ships via Git (`npx skills add`), not the npm tarball, so a
version-bumping type would have cut a release whose tarball was byte-identical to the
last. Reworded to `docs(skill)` — matching every prior skill-prose commit — and the rule
now lives in CLAUDE.md's commit guidelines.

## Retrospective

The verification-by-use step earned its keep twice over: reviewer subagents and the
verify-claims pass caught stale details a prose-only change would have shipped, and the
watermark flaw only surfaced because the freshly minted convention was exercised against
a real history rewrite minutes after being written. Distill-style skills should always be
proven on a live repo before shipping. One process note: the SHA convention came straight
from the menschen precedent without questioning its portability — precedent from a
direct-to-main repo doesn't automatically transfer to squash-merge or review workflows.
