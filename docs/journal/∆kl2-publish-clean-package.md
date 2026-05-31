---
id: ∆kl2
completed: 2026-05-31 07:05:31 +00:00
---

## Backlog item

> - ∆kl2 Make the published package publish-clean — the build compiles `src/**` including
>   `*.test.ts` and `src/mocks/`, and `files: ["dist","src"]` ships them, so the tarball carries
>   test code; exclude tests/mocks from the build output and the tarball. Also fix the malformed
>   `repository.url`, `bugs.url`, and `homepage` (each duplicates `@limulus/`). Surfaced by ∆IsK.

## Planning

The ∆IsK verification proved the consumer install works but `npm pack` shipped 142 files —
roughly half of them test code: the build compiled all of `src/**` (tests and `src/mocks/`
included), and `files: ["dist","src"]` then shipped both the compiled `*.test.js`/`.d.ts` and
the raw `src/**/*.test.ts`. The constraint that shaped the fix: the test files must STILL be
type-checked (`tscc` = `tsc --noEmit`) and run (vitest), so they can only be excluded from the
*published build and tarball*, never from the type-check or test runs.

## Refinement

Two-layer exclusion, each confirmed empirically with `npm pack --dry-run` rather than trusting
npm's documented `files`/`.npmignore` precedence:

- A new `tsconfig.build.json` (extends the root config, `exclude: ["**/*.test.ts",
  "src/mocks/**"]`) drives `build:esm`/`build:dts` via `tsc -p`, so `dist/` no longer emits
  test or mock output. `tscc` still uses the root `tsconfig.json`, so tests stay type-checked.
- The co-located `src/**/*.test.ts` and `src/mocks/**` still shipped through the `src`
  allowlist entry, so `files` gained `!`-negation globs for `**/*.test.*` and the mocks dirs.
  npm's packlist honored the negations on this version, so no `.npmignore` was needed.

Result: the tarball went 142 → 72 files, with zero `*.test.*` and zero `mocks/` paths, while
keeping the production bin/lib/types/src and `bin.delto`. Also fixed three package.json URLs
(`repository.url`, `bugs.url`, `homepage`) that each duplicated the `@limulus/` scope into a
broken `github.com/limulus/@limulus/delto` path. Coverage held at 100%.

## Retrospective

Worth stating plainly: a green test suite tells you nothing about what `npm pack` ships, and
the documented `files`-vs-`.npmignore` precedence is murky enough that the only trustworthy
check is the dry-run file list itself. This is exactly the defect ∆IsK existed to catch — it's
satisfying that pushing that verification to a real pack is what surfaced it. The
live-registry/pushed-ref consumer smoke still rides on [[∆LwK]] once a real publish lands.
