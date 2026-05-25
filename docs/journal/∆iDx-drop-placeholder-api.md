---
id: ∆iDx
date: 2026-05-25
title: Drop placeholder library API surface
---

## Backlog item

> - ∆iDx Delete `src/lib/Example.ts` and `src/index.ts`, and drop `main` / `types` /
>   `exports` from `package.json` — the package is bin-only until a real library
>   consumer appears. CLI subcommands import directly from `src/lib/*.ts`; a public
>   API surface can be added later when shaped by an actual use case

## Planning

The item entered planning in a much larger form: it named six functions
(`parseBacklog`, `computeEligibility`, `journalIds`, `claimedIds`, `claim`, `release`)
and three types (`BacklogItem`, `ItemEligibility`, `EligibilityResult`) as a public
surface to extract from `src/lib/`. The pushback was that no real consumer exists for
that surface — the CLI subcommands (∆qBS) consume `src/lib/*.ts` directly via
relative imports, and the consolidated `/delto` skill (∆Rnm) shells out to the
binary per ADR-001 rather than importing from the package. Exposing the helpers as a
named API turns internal shape decisions into semver commitments before there is a
use case to anchor the design.

The rewrite shrank ∆iDx to a deletion: remove `Example.ts` and `src/index.ts`, and
strip `main`/`types`/`exports` from `package.json`. The package becomes bin-only
(with the `bin` entry itself landing in ∆qBS), and a public API can be reintroduced
later when a real consumer shapes it. Two downstream ripples followed:

- **∆Lcv's `; needs: ∆iDx` was artificial** — library tests can import
  `src/lib/backlog-parser.ts` etc. directly without going through any public surface.
  Dropped the dependency at the same time as the rewrite.
- **∆Sre kept its dependency on ∆iDx** — the tarball-shape verification still needs
  to know the final `package.json` field set to assert against, so this deletion is
  a genuine prerequisite.

## Refinement

Three small implementation surprises:

- **Build still works with no entry point.** `tsc --outDir dist/esm` emits whatever
  `include` matches; with no `index.ts`, the output tree is just `dist/esm/lib/*`
  and `dist/esm/bin/*`. No config change needed.
- **`npm test` already fails on coverage.** The 100/100/100/100 thresholds in
  `vitest.config.ts` produce zero-coverage errors because no test files exist yet.
  That's ∆Lcv and ∆Bcv's scope, not ∆iDx's — verified with `lint`, `tscc`, and
  `build` instead. Worth flagging that until ∆Lcv lands, `npm run verify` is
  effectively `lint + tscc` with a permanently-red test leg.
- **∆Sre's body was stale post-edit.** It listed "`exports`, type definitions" as
  things to verify in the tarball — both gone now. Updated it to say "no
  `main`/`exports` (bin-only per ∆iDx)" so the future ∆Sre work has the right
  acceptance criteria.

Filed ∆uaD for the recurring `complete-item.ts` title/slug papercut — the ∆bSx and
∆HmI journals each called it out without filing a follow-up, and this completion hit
it a third time (needed `--title "Drop placeholder library API surface"` and
`--slug drop-placeholder-api` to avoid a sixteen-word slug). Filing it stops the
journals from logging the same observation a fourth time.

## Retrospective

The original ∆iDx was a YAGNI miss that the rewrite caught early — but only because
the item happened to be next in the queue and got read carefully. The same shape
mistake (naming a public surface for code that has no external consumer) could
appear in future items without the same scrutiny. The lesson for backlog grooming:
when an item proposes a public API, the next question is "who imports this?" If the
answer is "internal callers in this repo," default to keeping it internal.

The dependency cleanup (∆Lcv's stale `needs:`, ∆Sre's stale body text) was easy
because the lint catches missing/dangling references but not semantically-stale ones.
Worth keeping the habit of re-reading downstream `needs:`/body text when an item's
shape changes mid-flight, since the linter won't.
