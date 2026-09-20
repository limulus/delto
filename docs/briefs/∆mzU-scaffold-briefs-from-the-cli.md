---
id: ∆mzU
serves:
  - ∆q4w
  - ∆vvd
written: 2026-09-19
commit: 2633dad
---

# Scaffold briefs from the CLI

## Value

An agent writing a brief is handed the right structure and does not have to remember it.
Someone planning from a brief can see how old its advice is.

## Background

The chain check in `lint` (`∆q4w`) also needs frontmatter it can rely on. The precedent is
`complete`, which scaffolds journal entries.

## Serves

- `∆q4w`: the chain check needs a `serves` field that is always present and well-formed.
- `∆vvd`: the recorded date and commit tell the planner how stale the suggestions are.

## Scope and constraints

- A subcommand writes a brief for a deltoid, as `complete` does for a journal entry:
  frontmatter with `id`, the date, and the commit it was written against, then the sections
  with TODO comments. It refuses to overwrite an existing file.
- Outside a Git repository it omits the commit.
- `bootstrap` creates the briefs directory and its README at the location configured in
  the frontmatter (`∆Wak`).
- `--help` is the contract (ADR-001); `SKILL.md` documents the subcommand and points to it.
- Process-entry code stays in `src/bin/cli.ts`; everything else is covered by tests.

## Implementation suggestions

- Mirror `src/bin/complete.ts` and `journalEntry` in `src/lib/journal.ts`; put the template
  in `src/lib/templates/`.
- The subcommand's name is open; `brief` is one candidate.
