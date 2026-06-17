---
id: ∆CTB
completed: 2026-06-16 20:43:10 -07:00
---

## Backlog item

> - ∆CTB General eval of the `/delto` skill across all actions (add/plan/complete/spec-recall),
>   not just authoring — 9 sandboxed runs grading behavior against the spec, to find weak spots
>   and ground skill-improvement suggestions. Complements ∆Xtj's narrow authoring-reference A/B.

## Planning

Backfilled item — the eval ran before the deltoid existed. Scope was deliberately *broad*
where [[∆Xtj]] was narrow: ∆Xtj A/B-tested only the authoring reference, so this run covered
the rest of the skill's surface — the `add`/`plan`/`complete`/spec-recall actions and the
open ∆GJ3 routing concern.

Shape: 6 scenario types, then 2 follow-ups. Each agent got an isolated copy of the repo
(rsync sans `.git`/`node_modules`, the latter symlinked, each its own `git init`) so none
could touch the real backlog, journal, or git. Runs minted/claimed/completed via the local
`node ./src/bin/cli.ts`. Outcomes were verified against each sandbox's git state, not just
the agents' self-reports — which caught that `plan`'s claim landed in the gitignored
`.delto-claims.local.jsonl` and that `complete` committed (clean tree), facts the reports
alone would have left ambiguous.

## Refinement

The eval's own design was the surprise. The backlog is mature enough that 4 of 5 plausible
`add` prompts hit *genuine* existing coverage (∆PZ3 ×2, ∆rTJ, and a `surface --json` flag
already shipped) and correctly short-circuited to no-op — so the headline ∆GJ3 trap
(perform-instead-of-file) never fired on those. Two genuinely-novel, novelty-verified
follow-ups were added to get a clean read; only one (shell completion) actually exercised
the authoring path, and it passed — the agent filed an item rather than implementing.

Three findings became backlog work in the same change: ∆GJ3 was reframed from "investigate
and fix" to "measure the failure rate first, then decide" (one clean pass is weak evidence
the problem may already be mitigated); [[∆2hh]] captures broadening the duplicate check to
already-*shipped* work (an agent caught `surface --json` only on its own initiative); [[∆IUb]]
captures scoping the unconditional "dispatch a subagent" mandate, since 3 of 5 runs sensibly
read a small backlog inline. Full results in `docs/experiments/general-skill-eval.md`.

## Retrospective

The honest limit: a delto repo is saturated with delto context (`CLAUDE.md`, `BACKLOG.md`),
so the no-skill baseline behaved almost identically to the with-skill run on the one case it
was used — the skill's real lift would show more starkly in a bare consumer repo. Picking
eval prompts without checking novelty first wasted four of the six `add` scenarios on
already-covered work; next time, verify novelty up front (the lesson now baked into ∆GJ3's
own method). That the backlog kept absorbing "new" ideas as duplicates is itself a quiet
endorsement of its hygiene — and of the dedup behavior this eval was measuring.
