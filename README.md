# @limulus/delto

Keep a backlog. With your code. Give agents context.

Delto keeps a human-readable `BACKLOG.md` next to your code, and a completion journal
under `docs/journal/`. Every item starts with an immutable 3-character ID — a "deltoid"
like `∆u2o` — that travels with the item from the backlog into its journal entry, so
references stay stable forever. It ships as two cooperating pieces:

- the **`/delto` skill** — prose that teaches a coding agent the backlog lifecycle and the
  `BACKLOG.md` conventions, and
- the **`delto` CLI** — deterministic primitives the agent (or you) runs to mint IDs, find
  eligible work, claim and release items, and complete them.

The skill is the judgment; the CLI is the bookkeeping. Shape decisions are recorded in
[ADR-001](./docs/decisions/001-delto-cli-and-skill-shape.md).

## Getting started

### Install the `/delto` skill

The skill installs from Git into your project's `.claude/skills/`:

```sh
npx skills add limulus/delto
```

That copies `skills/delto/SKILL.md` — the delto spec (v1.0) plus lifecycle guidance — so
your agent knows how to read and maintain a delto backlog. Nothing else from the repo is
copied; the skill is prose-only and calls the CLI on demand.

### Run the `delto` tool

The CLI runs straight from the registry — pin the major version so the skill and tool stay
in lockstep:

```sh
npx @limulus/delto@1 <subcommand>
```

`@limulus/delto` is published to GitHub Packages, so a consumer adds one line to their
`.npmrc` (with a token that can read the package):

```
@limulus:registry=https://npm.pkg.github.com
```

## The backlog lifecycle

A delto backlog is just Markdown — initiatives (`##`) → epics (`###`) → items (`-`), each
item starting with its deltoid. Hard dependencies use a trailing `; needs: ∆aaa` suffix.
When an item is finished it's removed from `BACKLOG.md` and a journal entry takes its place.

The CLI gives an agent five deterministic primitives. Run `delto <subcommand> --help` for
the exact contract of each:

- **`delto mint`** — mint collision-free deltoid IDs, scanning the backlog and the journal so
  a new ID never clashes with live or completed work. (`delto mint --help`)
- **`delto surface`** — list the items free to work on right now, walking the `needs:` graph
  to skip anything blocked or already claimed. (`delto surface --help`)
- **`delto claim <deltoid>`** — record that you've started an item, so parallel agents don't
  step on each other. (`delto claim --help`)
- **`delto release <deltoid>`** — give up a claim you're not pursuing. (`delto release --help`)
- **`delto complete <deltoid> <journal-entry-path>`** — scaffold the item's journal entry
  (transcribing its bullet) and clear its claim. It deliberately leaves `BACKLOG.md` alone:
  run it while the bullet is still there, then remove the bullet yourself. (`delto complete --help`)

A typical loop: `surface` to choose work → `claim` it → do the work → `complete` it while the
bullet is still in `BACKLOG.md`, fill in the journal entry's Planning/Refinement/Retrospective,
remove the bullet, and commit. New work enters the backlog with a freshly `mint`ed deltoid.

## Requirements

- Node.js 18 or newer. The published CLI is compiled ESM; you don't need a build step to run
  it.

## License

UNLICENSED — © Eric McCarthy / limulus.net
