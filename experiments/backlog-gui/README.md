# delto backlog GUI — experiments

Throwaway GUI mockups exploring how delto could offer a local, difit-style tool for working
with `BACKLOG.md` and the completion journal. Spike for backlog item `∆oJF`.

## The shared base server

`server.ts` is a dependency-free Node server (run via Node's built-in `.ts` type-stripping —
no build step). It reads the **real** `BACKLOG.md` and `docs/journal/` through delto's own
`src/lib` parser, so every mockup shows true state. Each mockup is a different front-end
under `--public`; they all consume the same API.

```sh
node experiments/backlog-gui/server.ts          # serves ./public on 127.0.0.1:4517
node experiments/backlog-gui/server.ts --port 4600 --public path/to/mockup
```

Flags: `--port`, `--host` (default `127.0.0.1`), `--public`, `--repo`, `--journal-dir`.

## The one rule: the GUI never writes `BACKLOG.md`

`BACKLOG.md` is the source of truth and the **agent** owns edits to it, so it keeps context.
A GUI therefore *records intent* instead of editing — it POSTs to `/api/intents`, which
appends to a `.gitignore`d `.delto-gui-intents.local.jsonl` queue beside the backlog. The
agent drains that queue and makes the actual edits. This is the same hand-off difit uses for
review comments.

## API

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/snapshot` | `{ backlog, journal, stats, intents }` — everything at once |
| GET | `/api/backlog` | `{ generatedAt, repoRoot, initiatives[], items[], raw }` |
| GET | `/api/journal` | `{ entries[], stats }` |
| GET | `/api/journal/:file` | one entry + `html` (rendered body) |
| GET | `/api/intents` | `{ intents[] }` |
| POST | `/api/intents` | record an intent — body `{ kind, deltoid?, note?, ... }` → `201` |
| POST | `/api/intents/:seq/resolve` | mark an intent handled |
| POST | `/api/render` | body = Markdown → `{ html }` |

### `backlog.items[]` shape

```jsonc
{
  "deltoid": "∆Sre", "id": "Sre",
  "text": "Verify `semantic-release` produces …",
  "summary": "Verify `semantic-release` produces the expected …",
  "needs": [], "openNeeds": [], "dependents": ["LwK"],
  "eligible": true, "claimed": false, "blocked": false,
  "initiative": "First npm Publish", "epic": "Packaging & Release",
  "lineStart": 37, "lineCount": 4
}
```

### `journal.entries[]` shape

```jsonc
{
  "deltoid": "∆6zh", "id": "6zh",
  "completed": "2026-05-29 05:55:03 +00:00", "completedMs": 1748498103000,
  "title": "Mint Subcommand", "slug": "mint-subcommand",
  "file": "∆6zh-mint-subcommand.md",
  "item": "- ∆6zh Build `delto mint` …",
  "sections": [{ "heading": "Planning", "markdown": "…" }],
  "wordCount": 412
}
```
