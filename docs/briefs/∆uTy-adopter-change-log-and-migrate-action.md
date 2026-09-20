---
id: ∆uTy
serves:
  - cheap-adoption
written: 2026-09-19
commit: 2633dad
---

# Adopter change log and `migrate` action

## Value

Someone who set up delto a while ago updates the skill, and their backlog keeps working as
it is. The agent tells them, once, what has changed in how delto backlogs are written, and
offers to update the project step by step.

## Background

A project holds a copy of the skill. Installing or updating it brings whatever is latest;
there is no way to pick an older version. After an update, the skill can describe a way of
writing the backlog that the project's files do not yet follow. With no record of what
changed, an agent sees only that the two differ, and may rewrite files without asking or
report valid older files as errors.

## Serves

- `cheap-adoption`: keeping up with delto's changes costs the adopter a guided migration,
  not an investigation.

## Scope and constraints

- A log shipped in `skills/delto/references/`, so it travels with the skill through Git
  (ADR-001). One entry per decision that changes what an adopting project's files look like.
- Entries are numbered from 1 in the order they ship. The numbers are the only version the
  conventions have. Decided 2026-09-19: there is no "v2" of the skill or the spec, because
  the skill's metadata version selects the CLI major (which stays 1), an adopter cannot
  stay on an old skill version, and the conventions change in steps that one version jump
  cannot describe.
- Each entry states: what changed and when; how to recognize a project still on the old
  convention; the migration steps; and whether each step is mechanical or needs judgment.
- A project records, in its `BACKLOG.md` frontmatter, the number of the last entry it has
  applied (the field arrives with `∆Wak`). No recorded number means none applied.
- A `migrate` action in `SKILL.md`: tell the user which entries the project has not applied,
  guide the migration entry by entry in log order, and advance the recorded number as each
  entry is applied.
- On a project that is behind, the skill follows the conventions the project is on, using
  the log and the project's self-documented header to know what those are. It suggests
  migrating once, does not repeat the suggestion, never migrates silently, and never reports
  old-convention files as errors.
- An agent reads the log only when a project's recorded number is behind it.
- `SKILL.md` describes the current contract only. The log is the one place that describes
  prior behavior; say so at the top of the log so nobody removes it for that reason.
- A rule in this repo's `CLAUDE.md`: an adopter-facing change ships with its log entry in
  the same change.
- Validate with the eval methodology in `docs/experiments/`.

## Implementation suggestions

- Open the log with a baseline section describing what a project looks like before any
  entry is applied, so that "none applied" has something to point to.
- The distillation watermark in the journal README is the same pattern: a recorded point,
  and a procedure that processes what lies after it.
- Mechanical steps, such as backticking item prefixes, could later become a CLI subcommand.
  That is not part of this item.
- `∆8n4` is the first real use of the guide. Expect to revise the log format after it.
