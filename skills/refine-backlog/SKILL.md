---
name: refine-backlog
description: >-
  Lint BACKLOG.md structural integrity and fix what it flags. Use when the user asks to
  refine, lint, or check the backlog, or after bulk edits to BACKLOG.md. A script checks
  for duplicate IDs, unresolved or asymmetric needs:/touches: references, dependency
  cycles, and oversized items; you fix each violation in BACKLOG.md.
---

# Refine the backlog

Lints `BACKLOG.md` for the integrity rules described in its header and in `CLAUDE.md`,
then fixes what the lint reports. The script is read-only — it finds problems; you make
the edits.

## What it checks

1. **Duplicate IDs** — an `∆xxx` ID used by more than one item, or reused by an item
   whose ID already belongs to a completed entry in `docs/journal/`.
2. **Unresolved references** — a `needs:` or `touches:` ID that names neither a live
   `BACKLOG.md` item nor a completed `docs/journal/` entry.
3. **`needs:` cycles** — a hard-prerequisite loop among live items (nothing could be
   built first).
4. **`touches:` symmetry** — `touches:` is a same-file collision edge and must be
   declared on both items; the lint flags one-sided edges.
5. **Oversized items** — an item spanning more than 5 lines (ideally 2–3).

## Steps

1. **Run the linter.** From anywhere in the repo:

   ```bash
   node .claude/skills/refine-backlog/lint-backlog.ts
   ```

   It prints a ✓/✗ rundown of the five checks and exits non-zero if any failed. Add
   `--json` for machine-readable output.

2. **Stop if clean.** Exit 0 and all ✓ — report that and stop.

3. **Fix each violation in `BACKLOG.md`** (the script never edits anything):

   - **Duplicate ID** — keep the original on the older/shipped item; mint a fresh ID for
     the other with the generator one-liner in the `BACKLOG.md` header.
   - **Unresolved reference** — it is usually a typo or a renamed/removed item. Correct
     the ID, or drop the suffix if that dependency no longer applies.
   - **`needs:` cycle** — the loop is a scoping mistake; one edge is wrong. Remove or
     re-scope a `needs:` so the items can be ordered.
   - **`touches:` asymmetry** — add the missing reverse `touches:` to the named peer
     (keep both sides of every collision edge in sync).
   - **Oversized item** — tighten the prose to 5 lines or fewer.

4. **Re-run the linter** and confirm a clean exit before finishing.

## Notes

- Shares the `BACKLOG.md` parser with `plan-backlog-item` via
  `.claude/skills/lib/backlog-parser.ts` — one definition of "an item" for both skills.
- The script needs a Node version with built-in TypeScript type-stripping (no flag).
