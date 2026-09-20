---
id: ∆SwZ
serves:
  - ∆cCz
---

# The parser accepts the backticked item form

## Value

A project can start writing its items in the new form, "`∆foo`: sentence", and every delto
command still sees them.

## Background

`parseBacklog` matches only a bare, unbackticked item prefix today, so every subcommand
treats a backticked item as no item at all. `∆cCz`, which switches the skill to the new
form, cannot ship until the CLI reads it.

## Serves

- `∆cCz`: the skill cannot tell agents to write a form that the CLI does not read.

## Scope and constraints

- `parseBacklog` recognizes "- `∆foo`: text" as well as "- ∆foo text". Both forms may
  appear in one file.
- Backticked ids in the needs suffix already parse; add a test that keeps it so.
- `complete` transcribes the item verbatim; confirm it does for the new form.
- Additive: no project has to change, so there is no adopter log entry, the commit is
  `feat:`, and the CLI stays on major version 1.
- The warning in `src/lib/templates/backlog.ts`, that template text must never start a line
  like an item, now covers both forms.
- It must reach a published release well before `∆cCz` ships. A CLI without it sees zero
  items in a backticked backlog and reports nothing wrong.

## Implementation suggestions

- Extend the `itemStart` pattern in `parseBacklog` and keep the shared `ID` constant.
- Once this is released, the items in delto's "Short readable items" initiative can take
  the backticked prefix.
- `lint` could later warn about a file that mixes the two forms.
