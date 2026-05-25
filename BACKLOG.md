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

- ∆uaD Remove `complete-item.ts`'s title/slug auto-derivation entirely — picking a
  good title from a backlog bullet is LLM judgment, not regex work, and the
  fallback has produced unusable defaults on every recent completion. Make
  `--title` and `--slug` required (keep the slug-format validator), and update
  `SKILL.md` to instruct the agent to pick them from the item before invoking

## First npm Publish

Foundational initiative — what `@limulus/delto` needs before it can be published with
real library exports, full test coverage, and a working consumer story. Shape decisions
captured in [ADR-001](./docs/decisions/001-delto-cli-and-skill-shape.md).

### Library & CLI

- ∆qBS Build the `delto` CLI per ADR-001 — `src/bin/delto.ts` router + subcommand
  modules at `src/bin/<subcommand>.ts` sharing `src/lib/`; `package.json` `bin: {
  "delto": "./dist/esm/bin/delto.js" }`; per-subcommand `--help` carries the
  contract; templates under `src/lib/templates/` for the bootstrap subcommand;
  touches: ∆Tmp
- ∆Tmp Bundle the consumer-facing templates with the package — a starter
  `BACKLOG.md` (this file's header structure, parameterized by project name) and a
  `docs/journal/README.md` (template + workflow) under `src/lib/templates/`,
  materialized by `delto bootstrap`; touches: ∆qBS

### Skill Packaging

- ∆Rnm Write the consolidated `/delto` skill per ADR-001 — `skills/delto/SKILL.md`
  (prose-only, covers the full backlog lifecycle; `--help` is the subcommand
  contract); remove any legacy per-script skill directories and their embedded
  `lib/`; retarget `.claude/skills/` symlinks; needs: ∆qBS; touches: ∆IsK
- ∆IsK Verify `npx skills add` reaches the consolidated `/delto` skill from the Git
  ref — directory layout, `SKILL.md` frontmatter, and the `command -v / npx -p`
  fallback for invoking the `delto` bin all work end-to-end on a fresh consumer
  checkout; needs: ∆Rnm; touches: ∆Rnm

### Testing & QA

- ∆Lcv Unit tests for the library at 100% coverage — `src/lib/backlog-parser.ts`,
  `src/lib/eligibility.ts`, `src/lib/claims-ledger.ts`. Vitest's threshold is
  already 100/100/100/100, so the tests are the gate
- ∆Bcv Tests for the `delto` CLI — exercise each subcommand against fixture
  `BACKLOG.md` / `docs/journal/` trees to hit 100% coverage on `src/bin/`;
  needs: ∆Lcv, ∆qBS

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
