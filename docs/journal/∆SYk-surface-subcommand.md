---
id: ∆SYk
completed: 2026-05-29 06:07:03 +00:00
---

## Backlog item

> - ∆SYk Build `delto surface` — port `plan-backlog-item`'s `find-eligible-tasks.ts`
>   eligibility logic to `src/lib/` + `src/bin/surface.ts` test-first: traverse the
>   `needs:` graph, exclude claimed and blocked items, emit eligible deltoids. Register
>   in the router; needs: ∆qBS

## Planning

`find-eligible-tasks.ts` was three things at once: a BACKLOG.md parser, the eligibility
rule, and a `--claim`/`--release` writer. The ADR-001 primitive split means each lands in
its own place: parsing + the rule into `src/lib/`, the report into `src/bin/surface.ts`,
and claim/release already shipped as their own subcommands (∆ICw). `surface` is now purely
read-only — it surfaces, it does not mutate.

- `parseBacklog` and `suffixIds` joined `src/lib/backlog.ts`; `computeEligibility` (and its
  result types) became `src/lib/eligibility.ts`, ported verbatim — the rule was already
  pure and correct.
- Deliberately did **not** port `journalIds`. A `needs:` ref is "open" only while its
  target is still a live BACKLOG item; once completed (in the journal, gone from BACKLOG)
  it filters out as satisfied, so the eligibility rule never needs to scan the journal. The
  helper belongs to the deferred `refine`/`status` work, and the 100% gate rejects
  un-exercised ported code.

## Refinement

- Simplified the human report to one deltoid per line with a `→N` dependent count, dropping
  the legacy 8-column grid — easier to read and to assert on, and `--json` carries the full
  verdict for machine callers.
- Coverage came from three angles, all mock-free: `parseBacklog`'s heading-level, wrapped-
  continuation, and starts-with-`#`-but-not-a-heading branches via a direct BACKLOG.md
  fixture; `computeEligibility`'s symmetric-`touches:` inference and `needs:` inversion via
  crafted `BacklogItem[]`; and `surface`'s output branches (none-eligible, no-excluded,
  JSON, each exclusion reason) by running the real subcommand over a temp repo whose claims
  were written with the real ledger `claim()`.
- Dogfooded against this very repo before committing: `surface` correctly showed `∆SYk →1`
  and `∆yNQ →1` (both feed `∆Rnm`), with `∆Rnm`/`∆IsK`/`∆Rdm` excluded as `needs:`-blocked.

## Retrospective

Letting the dependency graph drive the build order keeps paying off: `surface` slotted onto
an already-tested ledger and parser with no stubs. And keeping the parser and the rule as
pure library functions meant they could be tested directly with data while the bin got
behavior tests — the right tool at each layer, none of it reaching for a mock.

The "port only what's exercised" discipline is now visibly shaping the parser: it has
exactly `findRepoRoot`, `parseBacklog`, and `suffixIds` because that's all `mint`, `surface`,
and (next) `complete` use. `journalIds` and friends will return if and when `refine`/
`status` come back off Someday/Maybe.
