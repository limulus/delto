# Delto Backlog

Organized as Initiative (`##`) → Epic (`###`) → Item (`-`); initiatives are roughly
priority-ordered, items 5 lines max. Refactors stays pinned at the top as a standing
top-priority initiative.

Each item starts with a 3-char alphanumeric ID prefixed `∆` (e.g. `- ∆OID Notify route —
…`). These “deltoids” are immutable and travel with the item into its final
`docs/journal/∆OID-slug.md` entry so cross-references stay stable. To mint a collision-free
deltoid, run `delto mint --journal-dir docs/journal` (see `delto mint --help`).

Hard prerequisites use a trailing `; needs: ∆OID[, ∆OID]` suffix — logical blockers, the
only dependency mechanism in the `/delto` SKILL.md spec (v1.0).

## Refactors

Standing initiative — do not remove, even if no items.

- ∆y0B Keep `src/bin/` to the CLI entry and subcommands only — move non-command helpers
  (`io.ts` + its test) into `src/lib/`, relocate the `OutputStream`/`RunOptions` DI types
  out of `bin/delto.ts` so lib never imports bin, and split the router-only `subcommands`
  field into a `RouterOptions` type. Surfaced by the feat/cli-primitives self-review.
- ∆hoW DRY the subcommands and clear the remaining feat/cli-primitives review nits: extract
  `parseDeltoid()` + `resolveRepoRoot()` lib helpers, resolve cwd once in `complete` (and
  soften "released the claim" → "cleared any claim"), rename the shadowing `catch (err)` in
  `delto.ts`, and drop the dead `mkdirSync` in `claims-ledger.ts`.
- ∆HQN Document the complete-before-prune ordering in the `/delto` SKILL.md `## Committing`
  workflow — `delto complete` must run while the item is still in BACKLOG.md (it transcribes
  the bullet), then remove the bullet. Surfaced by the ∆yNQ journal review.

## First npm Publish

Foundational initiative — what `@limulus/delto` needs before it can be published: the
`delto` CLI subcommands the `/delto` `SKILL.md` documents (mint, surface, claim, release,
complete), full test coverage, and a working consumer story (skill install via `npx skills
add` + tool via `npx @limulus/delto@1`). Shape decisions captured in
[ADR-001](./docs/decisions/001-delto-cli-and-skill-shape.md).

### Skill Packaging

- ∆Rnm Cut over to the consolidated `/delto` skill — create the `.claude/skills/delto`
  symlink, delete the legacy `skills/<name>/` directories and the embedded
  `skills/lib/`, and delete any leftover `src/legacy/` files. The consolidated
  `SKILL.md` is already written; needs: ∆6zh, ∆SYk, ∆ICw, ∆yNQ
- ∆IsK Verify `npx skills add` reaches the consolidated `/delto` skill from the Git
  ref — directory layout and `SKILL.md` frontmatter resolve, and `npx @limulus/delto@1
  <sub>` runs the published bin end-to-end on a fresh consumer checkout; needs: ∆Rnm

### Packaging & Release

- ∆Rdm Real README + getting-started — replace the placeholders with what delto is, the
  install path (`npx skills add` for the `/delto` skill, `npx @limulus/delto@1` for the
  tool), and the backlog lifecycle linked to each subcommand's `--help`; needs: ∆IsK
- ∆Sre Verify `semantic-release` produces the expected `@limulus/delto` tarball — the
  `delto` `bin` entry and `files` per ADR-001's `src/` layout. No `main`/`exports`
  (bin-only per ∆iDx). Skill discovery is verified separately by ∆IsK (Git-driven, not
  tarball-driven); needs: ∆qBS
- ∆Bpr Enable GitHub branch protection on `main` — require PR + passing CI before merge
  so an accidental push (e.g. an agent in YOLO mode) cannot trigger an unreviewed
  publish

## Someday/Maybe

Work the current `/delto` `SKILL.md` spec (v1.0) does not call for. Parked until a spec
revision or concrete user need brings it back; logic for the first two survives in the
legacy skill scripts and Git history.

- ∆PZ3 `delto refine` — a `BACKLOG.md` structural linter (duplicate IDs, unresolved
  `needs:` references, dependency cycles, oversized items). Exists today as the legacy
  `refine-backlog`/`lint-backlog.ts`; not in the v1.0 spec
- ∆Stb `delto status` — a read-only progress report (per-initiative remaining work,
  eligible tasks, critical path). Exists today as the legacy
  `backlog-status`/`report-status.ts`; not in the v1.0 spec
- ∆Tmp `delto bootstrap` + bundled templates — a starter `BACKLOG.md` and
  `docs/journal/README.md` under `src/lib/templates/`, materialized into a fresh
  consumer project; not in the v1.0 spec
- ∆Pli Distribute delto as a Claude Code plugin so the `/delto` skill and the `delto`
  binary install together from a plugin marketplace, rather than `npx skills add` +
  `npx @limulus/delto@1` as separate steps
- ∆oJF GUI to visualize the backlog and journal — render the `needs:` graph, what's
  eligible, and completed-item history in a browser instead of plain text. Not in the
  v1.0 spec
- ∆rTJ Spike: repo-wide unique deltoids across multiple `BACKLOG.md`s in a monorepo.
  Decide whether deltoids are unique repo-wide (discover every `BACKLOG.md` + its journal
  dir — default `docs/journal/` relative to each, overridable via YAML frontmatter) or
  only per-backlog. Today `mint` scans the nearest backlog but resolves `--journal-dir`
  against the cwd, so it can miss in-flight ids and collide
- ∆NOp Spike: reconsider parallel-work collision detection (the removed `touches:` edge) —
  what signal actually predicts a merge collision, and whether it earns the backlog
  bookkeeping. The original symmetric same-file graph was undocumented and needs rethinking
