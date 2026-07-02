---
id: ∆GJ3
completed: 2026-07-01 22:24:36 -07:00
---

> **Retired without the dedicated run (2026-07-01).** No measurement was performed under
> this item; this entry records the decision to drop it. The evidence it asked for had
> already accumulated incidentally: across the [[∆Hp7]] and [[∆CTB]] evals, agents filed
> 4/4 novel imperative `/delto add` requests as backlog items (including a no-skill
> baseline) instead of performing them. With the failure mode unobserved in every trial,
> the user judged a dedicated repeated-trial run not worth the investment and dropped the
> item during a backlog rework. If the misfiling behavior is ever actually observed, file
> a fresh item citing this one rather than reviving ∆GJ3.

## Backlog item

> - ∆GJ3 Measure how often `/delto add <text>` makes an agent *perform* the request instead of
>   filing an item before investing in a fix — then likely downgrade. The ∆Hp7 menschen eval
>   filed 3/3 novel imperative adds (incl. the no-skill baseline); with ∆CTB that's 0 failures
>   in 4. A dedicated repeated-trial run on menschen should confirm the near-zero rate; if it
>   does, retire this. Only if real, fix (SKILL.md framing, action-routing cues, or tooling).

## Retrospective

The item was already framed measure-first ("then likely downgrade"), which made this an
easy call: the measurement question got answered by data gathered for other work before
anyone claimed it. The epic it anchored (`/delto add` authoring quality) survives with its
two remaining items — [[∆2hh]] (duplicate check should cover already-shipped work) and
[[∆IUb]] (scope the read-the-whole-backlog subagent mandate) — which are eval-validated
reference tweaks independent of the misfiling question.
