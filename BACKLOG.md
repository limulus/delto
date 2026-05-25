# Delto Backlog

Organized as Initiative (`##`) → Epic (`###`) → Item (`-`); initiatives are roughly
priority-ordered, items 5 lines max. Refactors stays pinned at the top as a standing
top-priority initiative.

Each item starts with a 3-char alphanumeric ID prefixed `∆` (e.g. `- ∆OID Notify route —
…`). These “deltoids” are immutable and travel with the item into its final
`docs/journal/∆OID-slug.md` entry so cross-references stay stable. When creating new items
use the `/delto add` skill, falling back to:

```sh
while id=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 3); \
  grep -rq "∆$id" BACKLOG.md docs/journal/; do :; done; echo "∆$id"
```

Hard prerequisites use a trailing `; needs: ∆OID[, ∆OID]` suffix — logical blockers.
Same-area collisions use `; touches: ∆OID[, ∆OID]` so parallel work knows to coordinate.

## Refactors

Standing initiative — do not remove, even if no items.

## First npm Publish

Foundational initiative — what `@limulus/delto` needs before it can be published with
real library exports, full test coverage, and a working consumer story. Shape decisions
captured in [ADR-001](./docs/decisions/001-delto-cli-and-skill-shape.md).

### Library & CLI

- ∆qBS Scaffold the `delto` CLI per ADR-001 — `src/bin/delto.ts` router with no
  subcommands wired (`--help` lists nothing yet), `package.json` `bin: { "delto":
  "./dist/esm/bin/delto.js" }`, and an empty `skills/delto/SKILL.md` skeleton for
  per-subcommand sections to append into. Tests written TDD-style. Each migration
  plugs in from here; touches: ∆Tmp
- ∆6zh Migrate `add-backlog-item` into `delto add` — review the skill, port its
  logic to `src/lib/` + `src/bin/add.ts` test-first (red/green), register in the
  router, append the subcommand's section to `skills/delto/SKILL.md`. Legacy
  `skills/add-backlog-item/` stays live until cutover (∆Rnm); needs: ∆qBS
- ∆SYk Migrate `plan-backlog-item` into `delto plan` — likewise: review, port to
  `src/lib/` + `src/bin/plan.ts` test-first, register in the router, append
  SKILL.md section. Legacy directory stays until ∆Rnm; needs: ∆qBS
- ∆PZ3 Migrate `refine-backlog` into `delto refine` — likewise: review, port to
  `src/lib/` + `src/bin/refine.ts` test-first, register in the router, append
  SKILL.md section. Legacy directory stays until ∆Rnm; needs: ∆qBS
- ∆yNQ Migrate `complete-backlog-item` into `delto complete` — likewise: review,
  port to `src/lib/` + `src/bin/complete.ts` test-first, register in the router,
  append SKILL.md section. Legacy directory stays until ∆Rnm; needs: ∆qBS
- ∆Stb Migrate `backlog-status` into `delto status` — likewise: review, port to
  `src/lib/` + `src/bin/status.ts` test-first, register in the router, append
  SKILL.md section. Legacy directory stays until ∆Rnm; needs: ∆qBS
- ∆Tmp Bundle the consumer-facing templates with the package — a starter
  `BACKLOG.md` (this file's header structure, parameterized by project name) and a
  `docs/journal/README.md` (template + workflow) under `src/lib/templates/`,
  materialized by a new `delto bootstrap` subcommand (TDD); touches: ∆qBS

### Skill Packaging

- ∆Rnm Cut over to the consolidated `/delto` skill — retarget `.claude/skills/`
  symlinks to `skills/delto/`, delete the legacy `skills/<name>/` directories and
  the embedded `skills/lib/`. Per-subcommand SKILL.md prose was already written by
  each migration; needs: ∆6zh, ∆SYk, ∆PZ3, ∆yNQ, ∆Stb; touches: ∆IsK
- ∆IsK Verify `npx skills add` reaches the consolidated `/delto` skill from the Git
  ref — directory layout, `SKILL.md` frontmatter, and the `command -v / npx -p`
  fallback for invoking the `delto` bin all work end-to-end on a fresh consumer
  checkout; needs: ∆Rnm; touches: ∆Rnm

### Testing & QA

- ∆Lcv Back-fill unit tests at 100% coverage for the grandfathered `src/lib/`
  modules — `backlog-parser.ts`, `eligibility.ts`, `claims-ledger.ts`. Vitest's
  threshold is already 100/100/100/100, so the tests are the gate. New code in
  `src/` lands TDD-style per CLAUDE.md, so this item is the one-time catch-up

### Packaging & Release

- ∆Rdm Real README + getting-started — replace the placeholders with what delto is,
  the install path (`npx skills add` for the `/delto` skill, then `npm i
  @limulus/delto` or rely on the `npx -p` fallback), and the full backlog
  lifecycle linked to each subcommand's `--help`; needs: ∆IsK
- ∆Sre Verify `semantic-release` produces the expected `@limulus/delto` tarball —
  the `delto` `bin` entry, `files`, and the bundled templates per ADR-001's `src/`
  layout. No `main`/`exports` (bin-only per ∆iDx). Skill discovery is verified
  separately by ∆IsK (Git-driven, not tarball-driven); needs: ∆qBS, ∆Tmp
- ∆Bpr Enable GitHub branch protection on `main` — require PR + passing CI before
  merge so an accidental push (e.g. an agent in YOLO mode) cannot trigger an
  unreviewed publish

## Future Enhancements

### Distribution

- ∆Pli Distribute delto as a Claude Code plugin so the consolidated `/delto` skill
  and the `delto` binary install together from a plugin marketplace, rather than via
  `npx skills add` + `npm install @limulus/delto` as separate steps
