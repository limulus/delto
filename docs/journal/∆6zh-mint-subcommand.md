---
id: ∆6zh
completed: 2026-05-29 05:55:03 +00:00
---

## Backlog item

> - ∆6zh Build `delto mint` — port `add-backlog-item`'s `mint-id.ts` to `src/lib/` +
>   `src/bin/mint.ts` test-first (red/green), minting collision-free deltoids by scanning
>   `BACKLOG.md` and the journal dir (`--journal-dir`), with `--count <n>`. Register in
>   the router; needs: ∆qBS

## Planning

`mint-id.ts` ported into two layers: a pure `src/lib/mint.ts` (`takenIds`, `randomId`,
`mint`) and a thin `src/bin/mint.ts` `Subcommand` that does only arg-parsing + I/O. The
split is what makes the minting logic testable without a process, and it sets the template
for the three primitives that follow.

Three design moves came out of reading the spec against the legacy script:

- **`--journal-dir` is explicit, not derived.** Legacy hard-coded `docs/journal` off the
  repo root; the v1.0 `SKILL.md` makes the caller pass it. That is also a monorepo-scoping
  safeguard — the caller names the journal dir for the package being minted into, so
  collisions are checked against the right scope.
- **`findRepoRoot` returns `string | undefined` instead of `process.exit`ing.** Moved it
  to `src/lib/backlog.ts` and let the bin turn "not found" into a stderr line + exit 1.
  Resolution is nearest-`BACKLOG.md`-wins via `find-up-simple`, which is the safe monorepo
  behavior: from inside a package you get that package's backlog, never a sibling's.
- **Injected the working directory.** Added `cwd` to `RunOptions` and an `src/bin/io.ts`
  (`out`/`err`/`cwd`) so subcommands resolve their streams and base directory injectably.
  That is what lets every test drive a real temp repo through the real `run()` — no
  `process.chdir`, no mocks.

## Refinement

- The 100% branch gate flagged `opts.cwd ?? process.cwd()` as half-covered (tests always
  inject `cwd`). Rather than make every future subcommand re-cover that fallback,
  centralized stream/cwd defaulting into `io.ts` and covered it once with direct assertions
  there; the router now uses the same helpers, dropping its own inline defaulting.
- Randomness stayed test-friendly without `vi.mock`: `mint(count, taken, next = randomId)`
  takes an injectable generator. The real `randomId` path is exercised by behavior tests;
  the collision-retry branch (`continue`) by a deterministic sequence that collides with a
  taken id and a just-minted one.
- Ported only what `mint` uses — `ID` and `findRepoRoot`. `parseBacklog` and friends stay
  in the legacy reference until `surface` needs them, because the coverage gate rejects any
  un-exercised ported code.
- Updated the `BACKLOG.md` header's mint instructions to use `delto mint` (the shell
  fallback for "before the tool exists" is now obsolete).
- `lint:fix` corrected my import order — this repo sorts sibling (`./`) imports before
  parent (`../`).

## Retrospective

The lib/bin split plus injected seams made 100% behavior coverage fall out with zero mocks:
every test runs a real temp repo through the real subcommand and asserts on real stdout,
stderr, exit code, and filesystem. That is the shape to keep for `surface`, `claim`/
`release`, and `complete`.

Porting function-by-function (only what a commit exercises) rather than dropping in the
whole legacy file keeps each commit's coverage honest and its diff small — the parser will
grow one function at a time across the next three commits instead of arriving as dead code.
