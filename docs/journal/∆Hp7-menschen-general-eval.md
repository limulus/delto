---
id: ∆Hp7
completed: 2026-06-16 21:55:23 -07:00
---

## Backlog item

> - ∆Hp7 Re-run the general `/delto` skill eval on the menschen consumer repo — ∆CTB used the
>   delto repo itself, whose delto-tooling backlog collided with every novel `add` prompt and
>   left the ∆GJ3 trap with one clean shot. menschen (different domain, real consumer, ∆Xtj's
>   substrate) removes that confound. Breadth across all actions; the rigorous trap failure-rate
>   measurement stays with ∆GJ3.

## Planning

A direct response to [[∆CTB]]'s honest limit: its hardest question (the ∆GJ3
perform-vs-file trap) was undermined because the delto repo's own backlog *is about delto
tooling*, so every plausible novel `add` prompt collided with an existing item and the trap
never fired. menschen — a real consumer in an unrelated domain (IndieWeb/webmentions, 62
items), and already [[∆Xtj]]'s substrate — removes that confound: novel imperative prompts
(CSV export, dark-mode toggle, moderation undo) are trivial to write and verify absent.

Scope kept as breadth across all actions; the rigorous repeated-trial trap measurement
stays with ∆GJ3 (whose entry now pins menschen). Run as a dynamic Workflow —
`pipeline(scenarios, run, grade)` so each grader fired as its run finished — with every
grader checking sandbox **ground truth** (`git diff`/`status`/`log`), not the run agent's
self-report. 8 scenarios, 16 agents, ~155s, ~326k tokens. Full write-up:
`docs/experiments/menschen-general-skill-eval.md`.

## Refinement

8/8 passed, and two results went beyond re-confirming ∆CTB. **The trap did not reproduce**
on 3 clean novel-imperative shots — including the no-skill baseline, which filed correctly
using menschen's own shell-loop mint. That makes 4 clean adds across both evals with zero
perform-the-work failures, and reframes the failure as more about ambiguous framing than
skill absence. **The skill generalizes to a divergent consumer:** it deferred to menschen's
documented conventions over its own tool defaults (hyphen-bullet items, inline
`needs:`/`touches:`), and `complete` *reconciled* both journal formats — keeping the tool's
`id`/`completed` frontmatter while adding menschen's README-mandated `date`/`title`, and
pruning a dangling `needs:` edge on removal.

Two standing items earned fresh, independent support: the dark-mode agent caught menschen's
existing `prefers-color-scheme` theming ([[∆2hh]], already-shipped detection), and no
scenario dispatched a subagent for the dup scan even against a 62-item backlog ([[∆IUb]]).

## Retrospective

The ground-truth grading earned its keep: several run agents self-reported running the delto
`mint`, but graders found the surviving change was a manual append in menschen's house style —
a discrepancy that would have been invisible from self-reports alone. The trap evidence is now
strong enough (0/4) that ∆GJ3 looks more like a confirm-and-downgrade than an
investigate-and-fix; the honest move is still to let ∆GJ3's dedicated repeated-trial run make
that call rather than declaring it here on n=1-per-scenario. Left ∆GJ3 as-is for that reason.
