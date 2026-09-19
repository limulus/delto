---
id: ∆Wak
serves:
  - cheap-adoption
  - ∆mzU
  - ∆LNK
written: 2026-09-19
commit: 2633dad
---

# Project settings in `BACKLOG.md` frontmatter

## Value

Agents and the CLI. Today the journal directory is a flag that `mint` and `lint` require on
every call, and an agent learns its value by reading header prose. This initiative adds a
proposals directory and an outcomes file, which makes three locations. One machine-readable
block gives a single source for them. The same block records the last adopter-log entry
the project has applied, which lets an agent tell reliably which conventions a project
follows, where guessing from the files would not.

## Serves

- `cheap-adoption`: fewer flags to get right, and migration (`∆uTy`) can read how far a
  project has migrated.
- `∆mzU`, `∆LNK`: both have to locate a project's proposals directory.

## Scope and constraints

- YAML frontmatter at the top of `BACKLOG.md` holding: the journal directory, the proposals
  directory, the outcomes location, the item line cap, and the number of the last
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

- Key names: `journal`, `proposals`, `outcomes`, `max-lines`, `migrated-through`.
- Check `src/lib/journal.ts` for an existing frontmatter reader before adding a YAML
  dependency.
- Decide in planning whether a flag path stays cwd-relative.
