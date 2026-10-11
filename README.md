# @limulus/delto

Delto keeps a human-readable backlog — a `BACKLOG.md` — alongside your code, plus a journal of
completed work (by default under `docs/journal/`). Every item carries an immutable
three-character ID — a "deltoid" like `∆u2o` — that travels with it from the backlog into its
journal entry. Delto comes in two parts: the **`/delto` skill**, which teaches a coding agent how
to keep the backlog, and the **`delto` CLI**, the deterministic pieces the skill leans on —
minting collision-free IDs, finding eligible work, claiming, and completing.

## Getting started

```sh
npx skills add limulus/delto
npx @limulus/delto@1 bootstrap
```

`bootstrap` materializes the starter files into a project that has no `BACKLOG.md` yet: the
backlog itself, the journal README, and a `.gitignore` entry for delto's local claim ledger.

## Working with delto

Drive delto through the skill, usually as `/delto <action>`:

- **`/delto add`** — capture new work. Describe it conversationally and the skill mints a fresh
  deltoid, writes a well-formed item, and places it in the backlog.
- **`/delto plan`** — start on a piece of work. Name an item, or let the skill `surface` an
  eligible one (nothing blocked or already claimed), claim it for you, and plan it.
- **`/delto complete`** — accept finished work. The skill writes the item's journal entry, then
  removes it from `BACKLOG.md`, fitting whatever commit workflow you use.

Each step maps to a deterministic CLI subcommand (`bootstrap`, `mint`, `surface`, `claim`,
`release`, `complete`) — run any with `--help`, or read the skill, for the specifics.

## The backlog

A delto `BACKLOG.md` is plain Markdown: initiatives (`##`), optional epics (`###`), and work
items. An item is a deltoid and a one-line title, with an optional short description and an
optional `needs:` sub-bullet naming the items it depends on:

```markdown
- `∆s9F` Frobnicator affordance UI element
  - The button and progress indicator that call the endpoint.
  - needs: `∆7hy`, `∆jjA`
```

## The `∆` sigil

Using a non-ASCII character to prefix an ID may seem like a pain to type. However, on macOS,
it can be typed with option-J. For other systems and voice to text, the skill informs the
agent that either “delto” or “delta” followed by three characters is a deltoid.

## Requirements

Node.js 20 or newer.
