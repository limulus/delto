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
```

## Working with delto

Drive delto through the skill, usually as `/delto <action>`:

- **`/delto plan`** — start on a piece of work. Name an item, or let the skill `surface` an
  eligible one (nothing blocked or already claimed), claim it for you, and plan it.
- **`/delto complete`** — accept finished work. The skill writes the item's journal entry, then
  removes it from `BACKLOG.md`, fitting whatever commit workflow you use.

Adding work is just as conversational: ask for a new item and the skill mints a fresh deltoid and
places it. Each step maps to a deterministic CLI subcommand (`mint`, `surface`, `claim`,
`release`, `complete`) — run any with `--help`, or read the skill, for the specifics.

## The backlog

A delto `BACKLOG.md` is plain Markdown. The spec's only hard rules: each item carries a deltoid,
and a trailing `; needs: ∆aaa` marks a hard dependency. The rest is up to you — the skill's
examples group items under initiative and epic headings, but that's a convention, not a
requirement.

## The `∆` sigil

Using a non-ASCII character to prefix an ID may seem like a pain to type. However, on macOS,
it can be typed with option-J. For other systems and voice to text, the skill informs the
agent that either “delto” or “delta” followed by three characters is a deltoid.

## Requirements

Node.js 20 or newer.
