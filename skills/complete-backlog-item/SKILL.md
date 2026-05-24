---
name: complete-backlog-item
description: >-
  Complete a finished BACKLOG.md item — run the `## Committing` ritual end to end. Use
  when an item is implemented and the user is ready to commit it. A script extracts the
  item's bullet, scaffolds its docs/journal/ entry, and releases its plan-backlog-item
  claim; you remove the item from BACKLOG.md, write the journal prose, commit, and merge
  to main.
---

# Complete a backlog item

Runs the `## Committing` ritual in `CLAUDE.md` for an item whose implementation is
finished. A script does the mechanical bookkeeping — scaffold the `docs/journal/` entry,
release the `plan-backlog-item` claim, and report exactly what to drop from `BACKLOG.md`;
you remove the item, write the journal prose, then commit and merge to `main`. The
implementation change, the `BACKLOG.md` removal, and the journal entry land together in
one atomic commit.

## What the script does — and doesn't

`complete-item.ts` does the parts a script does more reliably than freehand editing:

- **extracts** the item's bullet from `BACKLOG.md` verbatim into the journal blockquote;
- **scaffolds** `docs/journal/∆<id>-<slug>.md` from the `docs/journal/README.md` template;
- **releases** the item's claim in the `plan-backlog-item` ledger.

It is **read-only on `BACKLOG.md`** — it never edits it. It prints the exact lines to
delete (and whether an emptied epic/initiative heading goes with them); *you* make that
edit. This is the same script-detects / agent-edits split that `refine-backlog` and
`plan-backlog-item` use.

## Steps

1. **Confirm the item is done.** Its implementation is complete, tests pass, and the user
   has asked to commit it. If not, stop — an item stays in `BACKLOG.md` while work is in
   flight (see `CLAUDE.md` → Backlog & Progress Tracking). If you are working in a
   worktree, fast-forward the branch to current `main` now — it may have branched from a
   stale base, and syncing up front keeps the later `BACKLOG.md` removal and the merge
   conflict-free.

2. **Preview with `--dry-run`.** From anywhere in the repo:

   ```bash
   node .claude/skills/complete-backlog-item/complete-item.ts <id> --dry-run
   ```

   Check the derived title and slug in the preview. Re-run with `--title "<title>"`
   and/or `--slug <kebab-slug>` if either reads poorly (e.g. too long, or it kept
   backticks from the backlog text).

3. **Run it for real.** Drop `--dry-run`, keep any `--title`/`--slug` overrides. It writes
   the journal file, releases the claim, and prints the `BACKLOG.md` deletion to make.
   Run this *before* editing `BACKLOG.md` — it reads the live item to build the journal.

4. **Apply the `BACKLOG.md` deletion** the script printed — remove the item's lines, and
   if it reported an emptied epic or initiative, remove that heading and its description
   block too. `## Refactors` always stays even when empty.

5. **Write the journal prose.** Open `docs/journal/∆<id>-<slug>.md` and replace each
   `<!-- TODO … -->` block with real prose — **Planning**, **Refinement**,
   **Retrospective** — describing what *actually* happened (see `docs/journal/README.md`).
   Leave no `<!-- TODO` behind.

6. **Verify the backlog.** Run the `refine-backlog` linter to confirm `BACKLOG.md` is still
   structurally sound after the removal:

   ```bash
   node .claude/skills/refine-backlog/lint-backlog.ts
   ```

7. **Commit.** Stage the implementation change, the `BACKLOG.md` removal, and the new
   journal entry together and commit them as one — per `CLAUDE.md` → `## Committing` and
   the commit message guidelines.

8. **Merge into `main`.** Advance `main` to the completion commit — a fast-forward, run
   from the main checkout since a worktree can't check out `main`. If `main` moved again
   since step 1, fast-forward the branch onto it first, resolving any `BACKLOG.md`
   conflict from a parallel completion by keeping both removals and re-running the
   `refine-backlog` linter. This keeps `main`'s history linear. Remove the worktree once
   merged. **Do not push** — pushing `main` triggers `semantic-release`.

## Notes

- The script refuses to run when the ID is not in `BACKLOG.md`, or when a
  `docs/journal/∆<id>-*.md` entry already exists — both mean the item is already done.
- The claim release is best-effort: a completed item drops out of `plan-backlog-item`'s
  report once it leaves `BACKLOG.md` regardless, so a release recorded in a different
  checkout's (`.gitignore`'d) ledger is harmless.
- Shares `BACKLOG.md` parsing with the sibling skills via
  `.claude/skills/lib/backlog-parser.ts`, and the claim ledger via
  `.claude/skills/lib/claims-ledger.ts`.
- The script needs a Node version with built-in TypeScript type-stripping (no flag).
