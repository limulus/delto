---
id: ∆Wak
serves:
  - cheap-adoption
  - ∆mzU
  - ∆LNK
  - ∆q4w
---

# Project settings in `BACKLOG.md` frontmatter

## Value

An agent no longer has to be told where the journal is each time it runs a command. The
project states its folders and limits once, at the top of `BACKLOG.md`, and the agent and
the CLI both read them from there.

## Background

Today the journal directory is a flag that `mint` and `lint` require on every call, and an
agent learns its value by reading header prose. This initiative adds a briefs directory
and a benefits file, which makes three locations. The keys a project sets also tell the
tools which parts of delto it uses: `lint` checks briefs only where a briefs directory is
named.

## Serves

- `cheap-adoption`: fewer flags to get right, and a project adopts each part of delto by
  naming it.
- `∆mzU`, `∆LNK`, `∆q4w`: `bootstrap`, `complete`, and `lint` all have to locate a project's
  briefs directory.

## Scope and constraints

- YAML frontmatter at the top of `BACKLOG.md` holding: the journal directory, the briefs
  directory, the benefits location, and the item line cap. There is no version field: the
  conventions have no version (decided 2026-09-19, confirmed 2026-10-09 when the numbered
  adopter log was dropped from `∆uTy`). The keys present say what the project uses, and
  the tools check only what is named.
- `mint` and `lint` stop requiring `--journal-dir` when the frontmatter provides it. Flags
  stay and override the frontmatter. `lint --max-lines` defaults to the frontmatter's cap.
- `bootstrap` writes the block.
- A project with no frontmatter behaves exactly as it does today.
- Frontmatter paths resolve relative to the directory holding `BACKLOG.md`. This settles the
  per-backlog half of `∆rTJ`, which observed that `mint` resolves `--journal-dir` against
  the cwd. Repo-wide uniqueness across several backlogs stays with `∆rTJ`.
- Accepted cost: GitHub renders frontmatter as a table at the top of the file.
- Migration note (`∆uTy`): the block is optional for existing projects; adding it removes
  the need for the flags.

## Implementation suggestions

- Key names: `journal`, `briefs`, `benefits`, `max-lines`.
- Check `src/lib/journal.ts` for an existing frontmatter reader before adding a YAML
  dependency.
- Decide in planning whether a flag path stays cwd-relative.
