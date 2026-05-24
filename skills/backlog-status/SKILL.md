---
name: backlog-status
description: >-
  Read-only BACKLOG.md progress report. Use when the user wants a status overview, a
  progress check, what work is left, what is eligible to plan now, or the critical path
  to the next milestone. A script summarizes per-initiative remaining work, eligible
  tasks, and the longest needs: dependency chain — nothing is edited.
---

# Backlog status

Prints a read-only progress report over `BACKLOG.md` — where the remaining work sits,
what is free to plan now, and how deep the dependency chain runs to the next milestone.
Nothing is edited; this skill only reports.

## What it reports

1. **Progress by initiative** — every `##` initiative with open items, each split into
   eligible / blocked / in-flight counts, plus that initiative's deepest `needs:` chain
   length.
2. **Eligible now** — the task IDs free to plan, grouped under their initiative. Same
   eligibility rule as the plan-backlog-item skill (not claimed, not `needs:`-blocked,
   no `touches:` conflict with in-flight work).
3. **Critical path to the next milestone** — the longest `needs:` chain among the open
   items of the next initiative, skipping the standing `## Refactors` list. Its depth is
   a lower bound on the sequential planning cycles that milestone still needs.

"Completed vs remaining": journal entries (`docs/journal/∆xxx-*.md`) do not record which
initiative they belonged to, so the report gives a *global* completed count and
*per-initiative remaining* counts — per-initiative completed counts are not derivable.

## Steps

1. **Run the report.** From anywhere in the repo:

   ```bash
   node .claude/skills/backlog-status/report-status.ts
   ```

   Add `--json` for machine-readable output.

2. **Relay it.** Summarize for the user: the completed-vs-remaining picture, which
   initiative carries the most open work, what is eligible to pick up now, and the
   critical path to the next milestone. Surface anything notable — an initiative with no
   eligible work, or a long blocking chain.

3. **This skill never edits anything.** If the report points at a problem (e.g. a
   `needs:` cycle), hand off to refine-backlog; to actually plan a task, hand off to
   plan-backlog-item.

## Notes

- Shares the `BACKLOG.md` parser, claim ledger, and eligibility rule with the other
  backlog-tooling skills via `.claude/skills/lib/` — one definition of "an item" and of
  "eligible" for all of them.
- The script needs a Node version with built-in TypeScript type-stripping (no flag).
