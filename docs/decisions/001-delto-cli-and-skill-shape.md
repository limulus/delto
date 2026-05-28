# ADR-001 — `delto` CLI and skill shape

- **Status:** Accepted 2026-05-25; revised 2026-05-27 to match the `/delto` `SKILL.md`
  spec v1.0 (subcommand set, invocation pattern)
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
  "bin": { "delto": "./dist/esm/bin/cli.js" }
}
```

The bin name matches the unscoped package name, so `npx @limulus/delto <sub>`
resolves without a `-p` flag; with the package installed, `delto <sub>` resolves
directly.

Subcommands are **deterministic primitives**, not whole workflows. The split is
deliberate: the tool does only the mechanically reliable part — `mint`
(collision-free deltoids), `surface` (eligible-work discovery over the `needs:`
graph), `claim`/`release` (the parallel-work ledger), and `complete` (release a
claim + scaffold a journal entry) — while the agent supplies the judgment (where an
item belongs, which to pick, the prose). Earlier drafts imagined fat subcommands
(`add`, `plan`, `refine`, `status`, `bootstrap`); each either folded into a
primitive (`add` → the agent places an item whose id comes from `mint`) or was
deferred to Someday/Maybe. The set will evolve; nothing else in this ADR depends on
it. Per-subcommand `--help` is the **contract** — argv, flags, and output format
live there; skill prose links to it rather than duplicating it.

### 2. One skill — `/delto` — covering the full lifecycle

The backlog tooling ships as a single consolidated `/delto` skill rather than one
skill per subcommand. One coherent narrative reads better than several thin routers
and installs in one step.

The skill is **prose-only** and carries the load the primitives deliberately don't:
it states **the delto spec (v1.0)** — the normative definition of the backlog,
items, deltoids, and journal entries — and orchestrates the primitives into the
lifecycle (e.g. `plan` = `surface` → `claim` → write the plan). `SKILL.md` contains:

- The spec and the lifecycle as one narrative.
- Pointers to `--help` for each subcommand's contract.
- The invocation pattern (below).
- Sibling `.md` files for prose detail if any subsection grows large enough to
  warrant splitting.

### 3. Invocation pattern

`SKILL.md` command lines invoke the tool through `npx`, pinned to the package's
major version (read from the skill metadata):

```sh
npx @limulus/delto@1 <sub>
```

`npx` runs a locally installed copy when one is present and fetches from the
registry otherwise, so a single form covers both package-installed and skill-only
(`npx skills add` copied just the skill from Git) consumers — no `command -v`
branch. The `@major` pin keeps consumers on a compatible release as
`semantic-release` advances the version.

### 4. Source-of-truth layout

The router lives at `src/bin/delto.ts` (an exported `run`), with a thin
`src/bin/cli.ts` shim as the actual `bin` entry. Subcommand modules sit alongside as
`src/bin/<subcommand>.ts`, sharing pure logic with `src/lib/`. The consolidated
skill lives at `skills/delto/`, with `.claude/skills/delto` as a symlink for local
dogfooding.

### 5. Distribution channels — Git and tarball, decoupled

`@limulus/delto` ships through two independent channels with different shapes:

| Channel          | Reads from              | Carries                                                                | Used for                                                       |
| ---------------- | ----------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `npx skills add` | Git ref                 | `skills/delto/SKILL.md` (the directory only)                           | Installing the skill into the consumer's `.claude/skills/delto/` |
| npm tarball      | `npm publish` artifact  | `dist/esm/bin/cli.js` + the `src`/`dist` trees per `package.json` `files` | Providing the binary, via `npm install @limulus/delto` or `npx @limulus/delto@1` |

The two channels are decoupled by design: the skill directory does not need
anything from the tarball at install time, and the tarball does not need to ship
`skills/` at all. A consumer who installs only the skill still gets a working setup
because the skill's command lines call `npx @limulus/delto@1`, which fetches the bin
on demand.

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

This ADR is the canonical shape reference for the `First npm Publish` initiative in
`BACKLOG.md`; the `BACKLOG.md` rewrites that flow from it land alongside it.

### Hand-offs to downstream backlog items

- **∆qBS — Scaffold the CLI.** The `src/bin/delto.ts` router (exported `run`) plus a
  `src/bin/cli.ts` shim, the `bin` entry, and the `skills/delto/SKILL.md` skeleton.
  Subcommands plug in from here.
- **∆6zh / ∆SYk / ∆ICw / ∆yNQ — The primitives.** `mint`, `surface`,
  `claim`/`release`, and `complete`, each ported test-first into `src/bin/` +
  `src/lib/` with its own `--help`.
- **∆Rnm — Cut over to the single `/delto` skill.** Creates the
  `.claude/skills/delto` symlink and deletes the legacy per-script skill directories
  and their embedded `lib/`. The consolidated `SKILL.md` is already written.
- **∆IsK — Verify the install path.** The skill is discoverable from the Git ref and
  `npx @limulus/delto@1 <sub>` runs the bin end-to-end on a fresh consumer checkout.
- **∆Sre — Tarball verification.** `semantic-release` produces a tarball with
  `dist/esm/bin/cli.js` per the `files` / `bin` shape here. The skill ships through
  Git, not the tarball.
- **Someday/Maybe.** `∆PZ3` (`refine` linter), `∆Stb` (`status` report), `∆Tmp`
  (`bootstrap` + templates under `src/lib/templates/`), and `∆Pli` (Claude Code
  plugin bundling the same `skills/delto/` + bin) are deferred but compatible with
  this layout if revived.
