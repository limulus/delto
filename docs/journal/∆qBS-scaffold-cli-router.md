---
id: ∆qBS
completed: 2026-05-27 21:47:39 -07:00
---

## Backlog item

> - ∆qBS Scaffold the `delto` CLI per ADR-001 — `src/bin/delto.ts` router (no subcommands
>   wired yet, `--help` via `node:util` `parseArgs`), `src/bin/cli.ts` bin shim,
>   `package.json` `bin`, and the `skills/delto/SKILL.md` skeleton. Tests written
>   TDD-style. Each subcommand plugs in from here

## Planning

The item is intentionally a foundation, not a feature: a router that dispatches to
subcommands, with zero subcommands wired. Each later migration plugs in one primitive.
Two cleanup decisions came with it, both surfaced by reading the tree rather than the
item text:

- **`src/bin/` held stale copies** of all five legacy skill scripts, drifted from the
  live `skills/<name>/` versions. They wired to nothing and would have failed the
  coverage gate, so the scaffold deletes them; each subcommand reintroduces its own
  `src/bin/<sub>.ts` test-first.
- **`src/lib/` duplicated `skills/lib/`** as un-tested code. Moving it to `src/legacy/`
  (excluded from vitest coverage) lets `npm test` run green now, while leaving the
  helpers as a reference the subcommand migrations port from test-first. `src/legacy/`
  gets deleted at cutover (∆Rnm).

## Refinement

Three course-corrections during the build, each from user feedback:

- **Bin-entry detection.** The first cut used `process.argv[1] === fileURLToPath(import.meta.url)` behind a `v8 ignore`. Swapped to the `es-main` package for
  Windows correctness, then dropped both: the bin shim moved into its own
  `src/bin/cli.ts` (excluded from coverage) and `src/bin/delto.ts` became a pure,
  fully-covered `run()`. A spawn-based smoke test exercises the real shim — subprocess
  spawn verifies behavior but doesn't feed vitest's in-process v8 coverage, so the
  file split beat any inline ignore.
- **Argument parsing.** Replaced the hand-rolled argv scan with `node:util` `parseArgs`.
  The router pre-splits argv at the first positional so strict-mode parsing validates
  only its own flags and never trips on subcommand-level flags.
- **The subcommand model pivoted mid-flight.** The user rewrote `SKILL.md` from fat
  workflow subcommands (`add`/`plan`/`refine`/`complete`/`status`) to deterministic
  primitives (`mint`/`surface`/`claim`/`release`/`complete`) with the skill prose doing
  orchestration. That cascaded into a `BACKLOG.md` overhaul (reshape + a Someday/Maybe
  section), an ADR-001 revision, and a migration of every existing journal's
  frontmatter to the spec's `id`/`completed` shape — all bundled into this one commit
  at the user's request.

## Retrospective

The scaffold-first shape earned its keep: the subcommand model changed completely
mid-flight, yet the router, the shim, the bin entry, and the test harness needed no
rework. Only the `SKILL.md` skeleton (always meant to be overwritten) and the bin
filename (`delto.js` → `cli.js`) moved. Building the foundation before the walls meant
the walls could be redesigned for free.

The coverage lesson generalizes: when a line is only reachable as a process entry point,
don't reach for an ignore comment — isolate it in a file that's excluded by design and
prove it works with a spawn test. The ignore comment hides the gap; the file split names
it.

One wart worth owning: this commit mixes a `feat` (the scaffold) with a docs-and-spec
pivot (backlog, ADR, journal migration). Normally those split; here a single commit was
the explicit ask, so the body carries the enumeration the history would otherwise.
