---
id: ∆Sre
completed: 2026-06-11 22:29:15 -07:00
---

## Backlog item

> - ∆Sre Verify `semantic-release` produces the expected `@limulus/delto` tarball — the
>   `delto` `bin` entry and `files` per ADR-001's `src/` layout. No `main`/`exports`
>   (bin-only per ∆iDx). Skill discovery is verified separately by ∆IsK (Git-driven, not
>   tarball-driven)

## Planning

Two scope decisions reshaped the literal "verify" into something durable:

- **A regression guard, not a one-off.** [[∆kl2]] had already proven the tarball shape
  once by hand, and its retro concluded the dry-run file list is the only trustworthy
  check — so the deliverable became an automated test rather than a second manual pass.
- **Pack-equivalence over pipeline exercise.** There is no semantic-release config, so it
  runs its four default plugins, and `@semantic-release/npm` publishes via `npm publish` —
  whose packlist (same `files` allowlist, same `prepack`→build lifecycle) is identical to
  `npm pack`. Asserting pack output therefore *is* asserting the tarball semantic-release
  produces. Registry/auth stayed out of scope: that config is about to be replaced by
  [[∆fb2]], and the live half is [[∆LwK]]'s post-publish smoke.

Plan review added two requirements: smoke-run the binary, and keep the check off the
everyday `npm t` loop (it triggers a full build).

## Refinement

The check landed as `src/packaging.test.ts` under its own `vitest.pack.config.ts`
(coverage off — no production code loads, so the 100% thresholds would spuriously fail),
run via `npm run test:pack`. Every assertion was mutation-checked: temporary perturbations
(add `main`, drop each `files` negation, add `skills` to `files`, point `bin.delto` at a
missing path) each turned exactly the intended test red, then were reverted.

Two findings reworked the first draft:

- **The pack's `prepack` → `prebuild` → `clean` deletes `coverage/`.** Wiring `test:pack`
  into `verify` silently destroyed the coverage output CI uploads as an artifact. Review
  moved it out of `verify` entirely: it now runs from the pre-push hook (after `verify`)
  and as a CI step placed *after* the coverage upload.
- **The dry-run bin smoke was weak** — review asked whether packing could still break the
  binary. It could: running `dist/esm/bin/cli.js` from the repo resolves imports against
  the repo's `node_modules` (devDeps included), so an undeclared runtime dependency or a
  dropped file only breaks for consumers. The test now does a real pack into a temp dir,
  installs the tarball into a temp consumer project, and runs the linked
  `node_modules/.bin/delto` there. Mutation-proved: moving `find-up-simple` from
  `dependencies` to `devDependencies` turned exactly the installed-bin test red — a
  failure the dry-run version sailed past.

One subtle hardening: the spawned npm runs with inherited `npm_*` env vars stripped, so a
parent invocation like `npm test --ignore-scripts` can't leak `npm_config_*` into the
child and skip `prepack` (which would assert against a stale `dist/`).

## Retrospective

Both review comments materially improved the change — the coverage-deletion interaction
was caught empirically but the fix (reorder within `verify`) was still the wrong altitude
until review pulled the check out of `verify` altogether, and the "is a dry-run really the
tarball?" question upgraded the smoke from works-on-my-machine to consumer-faithful. The
mutation-check habit (perturb, watch the exact test go red, revert) is the right way to
TDD a guard over already-correct state; the `find-up-simple` mutation in particular is
what turned "the test passes" into "the test would have caught it."
