# ADR-001 — `delto` CLI and skill shape

- **Status:** Accepted (2026-05-25)
- **Backlog item:** ∆bSx

## Context

Delto needs a coherent shape for how its backlog tooling reaches a consumer and how
that tooling is invoked from a Claude Code skill. Two coupled questions need to be
answered together before downstream work — CLI implementation, skill packaging, test
coverage, tarball verification, plugin distribution — can plan against a stable
surface:

1. **What is the published invocation surface?** A single CLI binary; a set of
   binaries; files copied into the consumer's repo; or something else.
2. **What shape does the skill take in `.claude/skills/`?** One skill or many; what
   `SKILL.md` carries vs. what lives elsewhere; how `npx skills add` (which reads
   from a Git ref) interacts with the npm tarball (which carries the binary).

The invocation surface in `SKILL.md` is whatever the binary publishes, and the skill
directory shape is whatever the install channel will faithfully reproduce — so the
two questions are decided together.

## Decision

### 1. One binary — a single `delto` CLI router

`@limulus/delto` exposes one binary via `package.json`:

```json
{
  "bin": { "delto": "./dist/esm/bin/delto.js" }
}
```

The bin name matches the unscoped package name, so `npx @limulus/delto <sub>`
resolves without a `-p` flag; with the package installed, `delto <sub>` resolves
directly.

Subcommands cover the backlog lifecycle. The precise set, naming, and flag surface
are owned by the CLI implementation and will evolve — early candidates include
`add`, `plan`, `complete`, `refine`, `status`, and a `bootstrap` for first-run
scaffolding, but nothing in the rest of this ADR depends on that list.
Per-subcommand `--help` is the **contract**: each subcommand's argv, flags, and
output format live in its `--help` output. Skill prose links to `--help`; it does
not duplicate the contract.

### 2. One skill — `/delto` — covering the full lifecycle

The backlog tooling ships as a single consolidated `/delto` skill rather than one
skill per subcommand. One coherent narrative — the full backlog lifecycle, with
first-run scaffolding as a branch — reads better than several thin routers and
installs in one step.

The skill is **prose-only**. `SKILL.md` contains:

- The backlog lifecycle as one narrative.
- Pointers to `--help` for each subcommand's contract.
- The invocation pattern (below).
- Sibling `.md` files for prose detail if any subsection grows large enough to
  warrant splitting.

### 3. Invocation pattern with fallback

`SKILL.md` command lines prefer the installed bin, falling back to `npx`:

```sh
command -v delto >/dev/null && delto <sub> "$@" || npx -p @limulus/delto delto <sub> "$@"
```

This handles three install postures uniformly:

- **Package installed** (consumer has `@limulus/delto` as a dep, or it is globally
  linked): `delto` is on `$PATH`; the `command -v` branch wins.
- **Skill-only install** (`npx skills add` copied just the skill from Git): `delto`
  is not on `$PATH`; the `npx -p` branch fetches and runs it.
- **Source dogfooding in this repo**: a one-time `npm link` puts the local source
  on `$PATH` as `delto`; the `command -v` branch wins. The `SKILL.md` text is
  identical to the consumer copy.

### 4. Source-of-truth layout

The router lives at `src/bin/delto.ts`. Subcommand modules sit alongside as
`src/bin/<subcommand>.ts`, sharing pure logic with `src/lib/`. Bundled templates
(consumed by the bootstrap subcommand) sit under `src/lib/templates/`. The
consolidated skill lives at `skills/delto/`, with `.claude/skills/delto` as a
symlink for local dogfooding.

### 5. Distribution channels — Git and tarball, decoupled

`@limulus/delto` ships through two independent channels with different shapes:

| Channel          | Reads from              | Carries                                                                | Used for                                                       |
| ---------------- | ----------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `npx skills add` | Git ref                 | `skills/delto/SKILL.md` (the directory only)                           | Installing the skill into the consumer's `.claude/skills/delto/` |
| npm tarball      | `npm publish` artifact  | `dist/esm/bin/delto.js` and bundled templates per `package.json` `files` | Providing the binary, via `npm install @limulus/delto` or `npx @limulus/delto` |

The two channels are decoupled by design: the skill directory does not need
anything from the tarball at install time, and the tarball does not need to ship
`skills/` at all. A consumer who installs only the skill still gets a working
setup via the `npx -p` fallback.

A future Claude Code plugin distribution (∆Pli) is compatible: a plugin bundles the
same `skills/delto/` and the same `delto` bin together, so no rework is required to
adopt that channel later.

## Alternatives considered

- **Multiple thin namespaced skills (`/delto-add` etc.).** Rejected: once each
  `SKILL.md` becomes mostly a router pointing at `delto <sub>`, multiple routers
  duplicate prose and obscure the lifecycle. The consolidated skill shows the loop
  with one `npx skills add` command for the consumer.
- **Multiple bin entries (`delto-add`, `delto-plan`, …).** Rejected: increases the
  `package.json` `bin` surface, and `npx @limulus/delto <sub>` already gives a
  clean invocation form without per-subcommand bins. Single-router precedent:
  `git`, `npm`, `kubectl`, `gh`.
- **Copy-everything install — script files ship into the consumer's
  `.claude/skills/` and run from there.** Rejected: requires two sources of truth;
  `npx skills add` reads from Git and doesn't pull sibling library code, so the
  copy would need a separate installer; consumer-edited copies drift from upstream;
  harder semver story.
- **Pointer-style `SKILL.md` (consumer's stub `@<path>`-references the package's
  `SKILL.md`).** Rejected: Claude Code's `@<path>` expansion only fires for
  user-typed prompts, not inside `SKILL.md`.

## Consequences

This ADR is the canonical reference for ∆qBS, ∆Rnm, ∆IsK, ∆Tmp, ∆Bcv, and ∆Sre. The
`BACKLOG.md` rewrites that flow from this decision land in the same commit as the
ADR itself.

### Hand-offs to downstream backlog items

- **∆qBS — Build the `delto` CLI.** Implements the router at `src/bin/delto.ts` and
  the subcommand modules, wires the `bin` entry, owns the precise subcommand set
  and its `--help` contracts, bundles templates under `src/lib/templates/`.
- **∆Rnm — Consolidate to single `/delto` skill.** Writes `skills/delto/SKILL.md`,
  removes the legacy per-script skill directories and their embedded `lib/`,
  retargets the `.claude/skills/` symlink layer.
- **∆IsK — Verify `npx skills add` install path.** Confirms the consolidated
  `/delto` skill is discoverable and copyable from the Git ref, with the
  `command -v` / `npx -p` fallback working end-to-end.
- **∆Tmp — Bundle templates.** Adds the starter `BACKLOG.md` and
  `docs/journal/README.md` templates under `src/lib/templates/`, parameterized by
  project name.
- **∆Bcv — CLI test coverage.** Exercises each subcommand against fixture
  `BACKLOG.md` / `docs/journal/` trees to hit 100% coverage on `src/bin/`.
- **∆Sre — Tarball verification.** Confirms `semantic-release` produces a tarball
  with `dist/esm/bin/delto.js` and the bundled templates per the `package.json`
  `files` / `bin` shape described here. The skill directory ships through Git, not
  the tarball.
- **∆Pli — Plugin distribution (future).** Compatible. A Claude Code plugin
  bundles the same `skills/delto/` and the same `delto` bin; no shape change
  required.
