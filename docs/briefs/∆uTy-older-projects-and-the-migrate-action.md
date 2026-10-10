---
id: ∆uTy
serves:
  - cheap-adoption
---

# Older projects and the `migrate` action

## Value

Someone who set up delto a while ago updates the skill, and their backlog keeps working as
it is. The agent works in the project's existing style, mentions once that it could bring
the project up to date, and does so step by step when asked.

## Background

A project holds a copy of the skill. Installing or updating it brings whatever is latest;
there is no way to pick an older version. After an update, the skill can describe a way of
writing the backlog that the project's files do not yet follow. Without a rule, an agent
may rewrite files without asking, or report valid older files as errors.

A numbered log of adopter-facing changes, with each project recording the last entry it
had applied, was planned here and dropped on 2026-10-09. Every change in this initiative is
visible in a project's files, so an agent finds what to migrate by comparing the project
with the current spec; a log only earns its keep for a change where old and new files look
alike but mean different things, and none has happened. The conventions therefore have no
version; the keys in a project's frontmatter (`∆Wak`) say what it uses.

## Serves

- `cheap-adoption`: keeping up with delto's changes costs the adopter a guided migration,
  not an investigation, and costs nothing until they ask for it.

## Scope and constraints

- A paragraph in `SKILL.md`: a project may follow older conventions than the spec. Its
  `BACKLOG.md` header and frontmatter say what it uses; follow those. Where its files
  differ from the spec, offer once per conversation to migrate, never migrate unasked, and
  never report older-convention files as errors.
- A `migrate` action in `SKILL.md`, with the procedure in
  `references/migrating-older-projects.md`: compare the project's files with the current
  spec, list the differences to the user, and apply them in dependency order with the
  user's agreement, saying which steps are mechanical and which need judgment.
- The reference is written against the current shape only; it holds no history. It has a
  section of notes for specific changes, used only where the migration is not obvious
  from the spec, or where old and new files would look alike. Each note is dated.
- A rule in this repo's `CLAUDE.md`: a change to what an adopting project's files look
  like updates the migration reference in the same change, where the migration is not
  obvious from the spec.
- `SKILL.md` describes the current contract only. The migration reference is the one
  place that may describe older files; say so at its top so nobody removes it for that
  reason.
- Eval: nothing can be tested until the spec and a project's files first disagree, so the
  eval runs as part of `∆cCz`, whose brief says what to check.

## Implementation suggestions

- The distillation reference is the same kind of document: a procedure, with the
  judgment left to the agent.
- Mechanical steps, such as backticking item prefixes, could later become a CLI subcommand.
  That is not part of this item.
- `∆8n4` is the first real use of the reference. Expect to revise it after.
