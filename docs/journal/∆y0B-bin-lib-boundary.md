---
id: ∆y0B
completed: 2026-05-31 06:34:11 +00:00
---

## Backlog item

> - ∆y0B Keep `src/bin/` to the CLI entry and subcommands only — move non-command helpers
>   (`io.ts` + its test) into `src/lib/`, relocate the `OutputStream`/`RunOptions` DI types
>   out of `bin/delto.ts` so lib never imports bin, and split the router-only `subcommands`
>   field into a `RouterOptions` type. Surfaced by the feat/cli-primitives self-review.

## Planning

The self-review flagged a layering smell: `io.ts` lived in `src/bin/` but is a generic
helper, and it imported the `OutputStream`/`RunOptions` DI types from `bin/delto.ts`. The fix
is a clean dependency direction — `src/lib/` must never import from `src/bin/`.

Two moves fall out of that rule. First, `io.ts` can only live in `src/lib/` if the DI types
move with it; otherwise the relocated helper would still reach back into bin. So `lib/io.ts`
now *owns* `OutputStream` and `RunOptions`. Second, `RunOptions` carried a `subcommands?`
field that only the router reads — and typing it requires `Subcommand`, which is a bin
concept. Keeping that field on the lib type would force lib to know about bin again. So the
router-only field split into `RouterOptions extends RunOptions` back in `delto.ts`: the slim
`RunOptions` is all a subcommand ever needs, and `run()` takes the richer `RouterOptions`.

## Refinement

One importer lived outside the obvious set: `src/mocks/capture.ts` (the `OutputStream` test
double) imported the type from `bin/delto.ts` and had to be repointed to `lib/io.ts`. The
four subcommands that import the io helpers (`mint`, `surface`, `complete`, `ledger-command`)
moved their import into the `../lib/*` group, re-sorted alphabetically between
`claims-ledger` and `journal`. `git mv` preserved history for both moved files. Behavior is
unchanged — all 79 tests passed without edits, coverage stayed at 100%.

## Retrospective

Cleanly scoped by the self-review, so little drama. The only thing easy to miss was the mock
importer, which a plain "move the file" pass would have left dangling — a quick repo-wide grep
for the type names caught it up front. `RouterOptions extends RunOptions` reads better than
the old grab-bag interface and makes the router/subcommand boundary explicit in the types.
