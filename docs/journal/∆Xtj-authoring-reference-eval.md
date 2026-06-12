---
id: ∆Xtj
completed: 2026-06-12 11:25:30 -07:00
---

## Backlog item

> - ∆Xtj Evidence that `skills/delto/references/authoring-backlog-items.md` improves
>   agent-written backlog items — blind A/B eval (synthesized menschen prompts, Opus and
>   Sonnet cohorts with/without the reference, Fable 5 judges; report in
>   `docs/experiments/authoring-reference-eval.md`), then fold the findings back into the
>   reference — bdf1c03 landed the doc on argument alone, this measures it

## Planning

Backfilled item — the work ran before the deltoid existed. Two design decisions did the
heavy lifting:

- **Isolating the variable.** Git history showed bdf1c03 added *both* the reference and
  SKILL.md's `### add` section that links to it, so "old SKILL.md" would have been a
  confounded control. Control became current SKILL.md with only the link sentence replaced
  by the reference's length bullet verbatim — per Eric, length guidance had to stay
  constant so the eval measures the rest of the doc, not item length.
- **Pinning effort.** Subagents inherit the session's effort level, so cohort quality
  would silently track session state. Eric chose high for both generation agents and
  judges; with mid-session agent definitions unavailable (below), the session itself was
  raised to high for the run.

Shape: 8 scenario types synthesized from the menschen corpus (terse → placement-ambiguous,
including a near-duplicate trap and a journal-grounded re-add), 32 generation agents in
isolated sandbox copies, each minting via the local `node ./src/bin/cli.ts mint`, and 2
independent blind judges per scenario scoring anonymized A–D diffs.

## Refinement

Two harness gotchas reshaped the run: `.claude/agents/` definitions created mid-session do
not register (the planned `effort:` frontmatter pin was dead on arrival — hence the
session-level pivot), and Workflow `args` arrived as a JSON string, not an object. The
workflow's resume cache made both cheap to recover from: the synthesis agent's scenarios
replayed from cache and only generation/judging ran live.

The result earned the item's premise: treatment beat control for both models (Opus +0.31,
Sonnet +0.17 overall; 60/96 rank points; 12/16 first places to Opus+reference), with gains
concentrated in *why*, placement, and self-containment. One measured regression — Opus
with the reference blew menschen's 5-line cap on the two context-rich scenarios while
scoring best on content — was folded back into the reference in the same change: the Terse
bullet now says the richer the context you hold, the harder you must compress.

## Retrospective

The judges penalizing the treatment's verbosity is the most reassuring detail — a rubric
that shares the reference's values could have rubber-stamped its style, and didn't. The
verification scripts hit two classic shell traps (zsh not word-splitting an unquoted
variable, BSD `diff` silently lacking GNU's `--*-line-format`), both of which produced
empty-but-plausible output; rerunning with corrected tooling instead of trusting silence
was the right reflex. Honest limits: n=8 scenarios and value-aligned judges make this
evidence, not proof. The harness shape (isolated cohorts → blind panels → aggregate)
is exactly what the [[∆dlO]] backlog-quality spike calls for, and could be lifted nearly
verbatim.
