---
id: ∆Rnm
completed: 2026-05-31 06:49:55 +00:00
---

## Backlog item

> - ∆Rnm Cut over to the consolidated `/delto` skill — create the `.claude/skills/delto`
>   symlink, delete the legacy `skills/<name>/` directories and the embedded
>   `skills/lib/`, and delete any leftover `src/legacy/` files. The consolidated
>   `SKILL.md` is already written; needs: ∆6zh, ∆SYk, ∆ICw, ∆yNQ

## Planning

The five `delto` subcommands the consolidated skill documents (`mint`, `surface`,
`claim`/`release`, `complete`) had all shipped — ∆6zh, ∆SYk, ∆ICw, ∆yNQ are journaled — so the
needs were satisfied and the legacy skill scripts had nothing left to provide. The repo had
been carrying a two-tree mirror for the transition: `skills/<name>/` per-skill dirs with their
own `mint-id.ts`/`lint-backlog.ts`/etc., an embedded `skills/lib/` they shared, `src/legacy/`
as the canonical copy of that lib, and five git-tracked `.claude/skills/*` symlinks pointing
at the per-skill dirs. The cutover collapses all of that to one prose-only `skills/delto/`
plus a single `.claude/skills/delto` symlink.

Before deleting anything I confirmed no production code (`src/bin`, `src/lib`) imports
`src/legacy/` or `skills/`, and that the only live references to the legacy paths were the
backlog items describing the cutover and two Someday/Maybe items.

## Refinement

`git rm`-ing the last `.claude/skills/*` symlink removed the now-empty `.claude/skills/`
directory, so the new symlink's `ln -s` failed until I recreated the directory — a one-line
fix, but a reminder that git doesn't track directories. Two follow-on cleanups the bare
deletion would have left stale: the `src/legacy/**` entry in `vitest.config.ts`'s coverage
`exclude` (only needed because that untested code existed — removed it), and the ∆PZ3/∆Stb
Someday items plus the section intro, which claimed the linter/status logic "exists today as
the legacy scripts" (no longer true — re-pointed to Git history). Coverage held at 100%
(341 stmts / 136 branches) since `src/legacy/` was excluded from it anyway.

## Retrospective

Looking before deleting paid off twice — the grep for live references is what surfaced the
stale Someday/Maybe wording and the dead coverage exclude, neither of which is "delete the
legacy dirs" but both of which are part of leaving the repo honest after the cutover. The
empty-directory gotcha is worth remembering for any future symlink-swap. This unblocks ∆IsK
(consumer-install verification).
