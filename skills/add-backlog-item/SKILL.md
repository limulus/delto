---
name: add-backlog-item
description: >-
  Add a well-formed item to BACKLOG.md. Use when the user wants to add a backlog item,
  capture a new task or idea, put work on the backlog, or track something for later. A
  script mints a collision-free ∆ID; you place the item under the right initiative/epic,
  keep it terse, set needs:/touches: suffixes, and verify with the refine-backlog linter.
---

# Add a backlog item

Adds one new item to `BACKLOG.md` — a collision-free `∆ID`, correct Initiative→Epic
placement, terse text, and symmetric `needs:`/`touches:` suffixes. Completes the backlog
lifecycle alongside `refine-backlog` (lint), `plan-backlog-item` (plan), and
`complete-backlog-item` (complete).

## Steps

1. **Mint an ID.** From anywhere in the repo:

   ```bash
   node .claude/skills/add-backlog-item/mint-id.ts
   ```

   It prints one fresh `∆xxx` ID that collides with no live item, completed journal
   entry, or `needs:`/`touches:` reference. Adding several items at once? Mint them
   together with `--count <N>` so they stay mutually distinct.

2. **Place it.** Read `BACKLOG.md` and find the item's home, per the Initiative→Epic
   structure described in its header and in `CLAUDE.md`:

   - Put it under the **best-fitting `###` epic** within the **initiative** its work
     supports. Refactors always go under `## Refactors`.
   - If no epic fits, add a new `###` epic under the right initiative.
   - Add a new `##` initiative only if the work is genuinely a scope-bounded milestone
     of its own — not merely because no existing epic fits.
   - Within the epic, **append** the item by default. Document order is priority order,
     so place it earlier only when it is genuinely higher priority than the items
     already there.

3. **Write it terse.** One plain `- ` bullet:

   ```
   - ∆xxx Short imperative description of the work.
   ```

   Keep it to **5 lines max, ideally 2–3**. Indent wrapped continuation lines two spaces
   to align under the text. State the *what*, not a design — detail belongs in the plan,
   not the backlog.

4. **Set dependency suffixes.** Append to the item text, in this order:

   - `; needs: ∆aaa[, ∆bbb]` — hard logical prerequisites: the item cannot be built
     until those ship.
   - `; touches: ∆aaa[, ∆bbb]` — items that change the same files: risky to build in
     parallel.

   `touches:` is a **symmetric edge** — for every `touches: ∆peer` you add, also edit
   `∆peer` to add the reverse `touches:` back to the new ID. Skip a `touches:` peer that
   is already completed (in `docs/journal/`): there is no live item to update.

5. **Verify.** Run the `refine-backlog` linter:

   ```bash
   node .claude/skills/refine-backlog/lint-backlog.ts
   ```

   Confirm a clean exit. It catches a malformed item, an unresolved `needs:`/`touches:`
   reference, an oversized item, and a one-sided `touches:` edge — fix anything it flags,
   then re-run.

## Notes

- Shares the `BACKLOG.md` parser with `plan-backlog-item` and `refine-backlog` via
  `.claude/skills/lib/backlog-parser.ts` — one definition of an item for all three.
- No claim ledger — adding an item is a quick atomic edit, not in-flight work.
- The script needs a Node version with built-in TypeScript type-stripping (no flag).
