---
id: ∆mzU
serves:
  - ∆q4w
  - ∆vvd
written: 2026-09-19
commit: 2633dad
---

# Scaffold proposals from the CLI

## Value

Agents writing proposals get the structure without having to remember it. `lint` gets
frontmatter it can rely on. Planners can see how old a proposal's suggestions are.

## Serves

- `∆q4w`: the chain check needs a `serves` field that is always present and well-formed.
- `∆vvd`: the recorded date and commit tell the planner how stale the suggestions are.

## Scope and constraints

- A subcommand writes a proposal file for a deltoid, as `complete` does for a journal entry:
  frontmatter with `id`, the date, and the commit it was written against, then the sections
  with TODO comments. It refuses to overwrite an existing file.
- Outside a Git repository it omits the commit.
- `bootstrap` creates the proposals directory and its README at the location configured in
  the frontmatter (`∆Wak`).
- `--help` is the contract (ADR-001); `SKILL.md` documents the subcommand and points to it.
- Process-entry code stays in `src/bin/cli.ts`; everything else is covered by tests.

## Implementation suggestions

- Mirror `src/bin/complete.ts` and `journalEntry` in `src/lib/journal.ts`; put the template
  in `src/lib/templates/`.
- The subcommand's name is open; `propose` is one candidate.
