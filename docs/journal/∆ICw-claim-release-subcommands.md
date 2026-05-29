---
id: ∆ICw
completed: 2026-05-29 06:01:16 +00:00
---

## Backlog item

> - ∆ICw Build `delto claim <deltoid>` and `delto release <deltoid>` — port the claims
>   ledger (`claims-ledger.ts`) to `src/lib/` + `src/bin/claim.ts` + `src/bin/release.ts`
>   test-first; record/withdraw a claim so parallel agents don't collide. Register both
>   in the router; needs: ∆qBS

## Planning

Built ahead of `surface` despite being listed after it: `surface` must exclude *claimed*
items, so it depends on the ledger reader. The four primitives carry no `needs:` edges
between them (only `∆qBS`), so the build order is free to follow the code dependencies —
`claim`/`release` (the ledger) before `surface` and `complete`, which read it.

The legacy `claims-ledger.ts` computed its file path at module load via a `findRepoRoot()`
that `process.exit`ed on failure — unusable from a testable subcommand. The port makes the
repo root a parameter throughout: `claimsFile(root)`, `claimedIds(root)`, `claim(root, id)`,
`release(root, id)`. No module-level side effects, so importing the lib touches no
filesystem.

`claim` and `release` are nearly identical — parse one `<deltoid>`, validate it, resolve
the nearest BACKLOG.md, append one record, report. Rather than duplicate ~40 lines, the
shared shape lives in `src/bin/ledger-command.ts` as a `ledgerCommand(spec)` builder; the
two bin files are just specs (which record to append, what to print). The factory's
branches are covered once through `claim`'s tests; `release`'s tests prove its spec by
round-tripping a real claim → release.

## Refinement

- **Safety is structural, not bolted on.** Both commands are append-only to a
  `.gitignore`d ledger and never delete or overwrite — so even a wrong-root resolution in
  some odd CWD can't be destructive. The success line echoes the repo-relative ledger path
  so the operator can see *which* ledger was touched.
- The `∆` sigil is optional on input (`claim ∆abc` and `claim abc` both work) — humans
  reference deltoids loosely (per the spec), and stripping a leading `∆` before validating
  is the cheap accommodation.
- Rejected extra positionals (`claim ∆abc ∆def`) explicitly rather than silently using the
  first — a second id is more likely a mistake than intent.
- Kept the parser tolerant of junk lines (blank, non-JSON, id-less, non-string id) so a
  hand-edited or partially-written ledger degrades to "that line doesn't count" instead of
  throwing. Verified each of those branches with a crafted ledger fixture.

## Retrospective

The `ledgerCommand` factory paid for itself immediately: two real subcommands, one place
to fix a bug, and the second bin's test file is six lines of behavior rather than a copy of
the first. The same "shared builder + thin spec" shape is worth reaching for whenever two
subcommands differ only in their effect and their words.

Reordering against the BACKLOG's listed priority to match the code's actual dependency
graph kept every commit self-contained and green — no stubbing a not-yet-ported ledger
inside `surface`. When listed priority and build dependency disagree and nothing blocks it,
let the dependency win.
