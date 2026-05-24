---
name: plan-backlog-item
description: >-
  Pick the best next BACKLOG.md item and start planning it. Use when the user wants to
  choose what to work on next, find an unblocked backlog task, or asks to plan the next
  item. A script lists task IDs that are unclaimed, dependency-satisfied, and free of
  file-collision with in-flight work; you pick the highest-priority one and plan it.
---

# Plan the next backlog item

Selects the best `BACKLOG.md` item that is safe to start now, and plans it. Safe to run
in parallel with other agents: a local claim ledger keeps two sessions off the same task.

## How eligibility is decided

`BACKLOG.md` items carry trailing dependency suffixes (see the file's header and the
backlog section of `CLAUDE.md`):

- `; needs: ∆xxx` — hard prerequisites; the item can't be built until those ship.
- `; touches: ∆xxx` — items that change the same files; risky to run in parallel.

The script combines those suffixes with the claim ledger and excludes an item that is:

- **in-flight** — claimed in the ledger;
- **blocked** — a `needs:` prerequisite is still open (still listed in `BACKLOG.md`);
- **conflicting** — a `touches:` peer is currently in-flight.

## Steps

1. **List eligible tasks.** From anywhere in the repo, run:

   ```bash
   node .claude/skills/plan-backlog-item/find-eligible-tasks.ts
   ```

   It prints `ELIGIBLE` (task IDs in BACKLOG priority order, each tagged `→N` = how many
   other items name it as a `needs:` prerequisite) and a count of the tasks that are not
   yet startable. Add `--json` for machine-readable output — each eligible task's
   `unblocks` list, plus the full breakdown of excluded tasks with reasons.

2. **Stop if nothing is eligible.** Report that to the user and stop.

3. **Read `BACKLOG.md`.** The script outputs only IDs — read the file to learn what each
   eligible task is and to weigh priority and strategic value.

4. **Choose one task.** Default to the highest-priority (earliest-listed) eligible task.
   When two candidates are close in priority, prefer the higher `→N` — it is a keystone
   that unblocks more of the backlog. State the chosen `∆xxx` ID and a one-line rationale.
   If you spot a genuine prerequisite or same-file collision that is *not* captured by a
   `needs:`/`touches:` suffix, tell the user rather than silently working around it — the
   suffixes may need updating.

5. **Claim it before planning** so a parallel agent will not also pick it:

   ```bash
   node .claude/skills/plan-backlog-item/find-eligible-tasks.ts --claim <id>
   ```

6. **Plan it.** Continue directly into planning the chosen item, following the BDD
   dual-loop TDD workflow in `CLAUDE.md`. When the work moves into a git branch or
   worktree, name the branch starting with the task's three-character ID followed by a
   short slug — e.g. `1nk-admin-split-view` for `∆1nk`. This ties the branch back to the
   backlog item.

7. **If you abandon planning** (e.g. the plan is rejected and dropped), release the claim
   so the task frees up again:

   ```bash
   node .claude/skills/plan-backlog-item/find-eligible-tasks.ts --release <id>
   ```

## Notes

- **Claim ledger:** `claims.local.jsonl` (in this skill directory, `.gitignore`'d,
  append-only). Claims never expire — they persist through long reviews. A claim ends
  when you `--release` it, or when the task is completed and removed from `BACKLOG.md`
  (after which the script simply stops listing it).
- The script needs a Node version with built-in TypeScript type-stripping (no flag).
