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
and a benefits file, which makes three locations. The same block also records the last
adopter-log entry the project has applied (`∆uTy`), which lets an agent tell reliably how
the project's files are written, where guessing from the files would not.

## Serves

- `cheap-adoption`: fewer flags to get right, and migration (`∆uTy`) can read how far a
  project has migrated.
- `∆mzU`, `∆LNK`, `∆q4w`: `bootstrap`, `complete`, and `lint` all have to locate a project's
  briefs directory.

## Scope and constraints

- YAML frontmatter at the top of `BACKLOG.md` holding: the journal directory, the briefs
  directory, the benefits location, the item line cap, and the number of the last
  adopter-log entry the project has applied (`∆uTy`). There is no spec version field:
  decided 2026-09-19, the log's entry numbers are the only version the conventions have.
- `mint` and `lint` stop requiring `--journal-dir` when the frontmatter provides it. Flags
  stay and override the frontmatter. `lint --max-lines` defaults to the frontmatter's cap.
- `bootstrap` writes the block.
- A project with no frontmatter behaves exactly as it does today.
- Frontmatter paths resolve relative to the directory holding `BACKLOG.md`. This settles the
  per-backlog half of `∆rTJ`, which observed that `mint` resolves `--journal-dir` against
  the cwd. Repo-wide uniqueness across several backlogs stays with `∆rTJ`.
- Accepted cost: GitHub renders frontmatter as a table at the top of the file.
- Adopter log entry (`∆uTy`): the block is optional for existing projects; adding it
  removes the need for the flags.

## Implementation suggestions

- Key names: `journal`, `briefs`, `benefits`, `max-lines`, `migrated-through`.
- Check `src/lib/journal.ts` for an existing frontmatter reader before adding a YAML
  dependency.
- Decide in planning whether a flag path stays cwd-relative.
