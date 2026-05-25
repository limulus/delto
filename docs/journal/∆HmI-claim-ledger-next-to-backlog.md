---
id: ∆HmI
date: 2026-05-25
title: Place claim ledger alongside the backlog
---

## Backlog item

> - ∆HmI Place the claim ledger next to `BACKLOG.md` as a `.gitignore`d file, located
>   via the `find-up` package — the ledger path is derived from the backlog's
>   location; touches: ∆Rnm

## Planning

Three forks worth recording:

- **Sync vs async `find-up`.** `find-up` v7 is async-only — adopting it would ripple
  `await` through `claimedIds`, `claim`, `release`, `appendLedger`, and ~6 call sites
  in `find-eligible-tasks.ts`, `complete-item.ts`, and `report-status.ts`. The I/O is
  sub-millisecond local filesystem, so the async churn buys nothing. Settled on
  `find-up-simple` — the sibling sync package by the same maintainer (Sindre Sorhus),
  zero deps, same walk-up semantics. Documented trade-off: slightly less canonical
  package name in exchange for a minimal-ripple migration.
- **Filename.** Picked `.delto-claims.local.jsonl` — hidden dotfile, `delto-`
  namespaced, preserves the existing `.local.` convention. Considered the visible
  variant and a `.delto/` directory for future state; rejected both as YAGNI for a
  single ephemeral file.
- **`findRepoRoot()`'s misleading name.** The existing function walks up looking for
  `BACKLOG.md`, not `.git` — i.e. it already does what `find-up('BACKLOG.md')` does.
  Replaced its inline walk-up with `findUpSync('BACKLOG.md')` to satisfy the backlog
  item's "use the `find-up` package" requirement while keeping the function's name
  and external API stable. Renaming to `findBacklog`/`findBacklogRoot` would ripple
  to seven callers across both `src/` and `skills/` trees; deferred as a follow-up.

The two-tree mirror (`src/lib/` canonical, `skills/lib/` the active runtime via
`.claude/skills/` symlinks) is accepted as transitional. ∆Rnm will delete
`skills/lib/` outright, but until then every edit lands in both copies.

## Refinement

ESLint flagged my initial import order — `find-up-simple` should sit before `node:fs`,
not after. The fix was auto-applied via `npm run lint:fix`, but the lint script
(`eslint *.ts src`) only sees `src/`, so the mirrored `skills/lib/` copy had to be
synced manually after the auto-fix.

`complete-item.ts` again produced an oversized journal title and slug from the raw
backlog text (with backticks), exactly the wart I flagged at the end of the ∆bSx
completion. Worked around it with `--title` / `--slug` overrides for this entry too.
Two consecutive completions hitting the same papercut is signal — worth filing as a
follow-up item.

Cleaned up the now-stale `touches: ∆HmI` on ∆Rnm. The lint tolerated it (∆HmI resolves
to the new journal entry), but `touches:` is about parallel-work risk between live
items — once one side ships, the reference no longer carries information.

## Retrospective

`findRepoRoot()`'s misleading name surfaced during scoping but was the right call to
defer — a focused single-purpose PR beats one that quietly refactors seven import
sites. Worth filing the rename as its own backlog item rather than leaving it as
implicit tech debt.

The `complete-item.ts` title/slug derivation should be fixed before the next
completion: stripping backticks and capping length in the script removes a manual
step that recurs every commit. The fact that I noticed and described this in the
∆bSx retro and then hit it again in ∆HmI without filing the follow-up is on me.

The two-tree mirror tax is annoying but bounded — ∆Rnm has a definite end-date. Worth
keeping the mirror burden visible (it discourages further drift) and resisting the
temptation to make `skills/lib/` a symlink to `src/lib/` as a "temporary" fix; that
would just postpone the consolidation.
