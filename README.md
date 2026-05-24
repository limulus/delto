# @limulus/delto

Keep a backlog. With your code. Give agents context.

## Installation

Add the bundled skills to a Claude Code project:

```sh
npx skills add @limulus/delto
```

That copies the `add-backlog-item`, `plan-backlog-item`, `complete-backlog-item`,
`refine-backlog`, and `backlog-status` skills into `.claude/skills/`.

The same package also installs as a CLI:

```sh
npx @limulus/delto <command>
```

## CLI

```
delto <command> [...args]

Commands:
  mint, add     Mint fresh ∆xxx backlog IDs (one per line). --count N for N distinct IDs.
  plan          List BACKLOG.md task IDs free to plan now. --json | --claim <id> | --release <id>.
  complete      Run the `## Committing` ritual for a finished item. <id> [--slug] [--title] [--dry-run].
  refine, lint  Check BACKLOG.md structural integrity. --json for machine-readable output.
  status        Print a progress report over BACKLOG.md. --json for machine-readable output.
```

Every command operates on the `BACKLOG.md` at the nearest ancestor directory.

## Library

```javascript
import {
  findRepoRoot,
  parseBacklog,
  computeEligibility,
  claimedIds,
} from '@limulus/delto'

const repoRoot = findRepoRoot()
const items = parseBacklog(repoRoot)
const { order } = computeEligibility(items, claimedIds(repoRoot))
```
