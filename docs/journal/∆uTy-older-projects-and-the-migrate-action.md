---
id: ∆uTy
completed: 2026-10-09 19:34:33 -07:00
---

## Backlog item

> - ∆uTy An agent opening an older delto project works in its conventions and migrates it on
>   request, because the skill treats old files as valid and a reference guides the migration

## Value

Someone who set up delto a while ago updates the skill, and their backlog keeps working as
it is. The agent works in the project's existing style, mentions once that it could bring
the project up to date, and does so step by step when asked. Serves `cheap-adoption`:
keeping up with delto's changes costs the adopter a guided migration, not an investigation,
and costs nothing until they ask for it.

## Planning

The item was filed on 2026-09-19 as a numbered log of adopter-facing changes shipped with
the skill, with each project recording in its frontmatter the last entry it had applied.
On 2026-10-09, at planning, the maintainer asked whether the log was needed at all: an
agent can read the current expectations from the skill and find what differs. It can.
Every change in the "Short readable items" initiative is visible in a project's files
(bare prefixes, long items, no briefs folder, no frontmatter, no benefits file), so the
diff between the project and the spec is the migration, and the dependency order is
visible too. A log only earns its keep for a change where old and new files look alike but
mean different things, and none has happened. The log was dropped, with it the
`migrated-through` key planned for `∆Wak`, and the item was re-scoped to what was left:

- A "Projects on older conventions" section in `SKILL.md`: follow the project's header and
  frontmatter, treat differences from the spec as not errors, offer once per conversation
  to migrate, never migrate unasked.
- A `migrate` action, with the procedure in `references/migrating-older-projects.md`: find
  what differs, list it with mechanical and judgment steps marked, apply in dependency
  order with the user's agreement, keep the header truthful after each step. The reference
  ends with a "Notes on specific changes" section, empty until a change needs one.
- A `CLAUDE.md` rule: a change to what an adopting project's files look like adds its note
  to the reference in the same change, when the migration is not obvious from the spec.

The conventions therefore have no version. The keys in a project's frontmatter say what it
uses, and the tools check only what is named. The `∆YQb` brief records this for ADR-002.

## Refinement

No eval ran. Nothing can be tested until the spec and a project's files first disagree,
and today they agree everywhere; the first eval is part of `∆cCz`, whose brief says what
to check (an older project's bare items are not reported as errors nor rewritten unasked,
the offer is made once, and `migrate` converts them). The brief was folded into this entry
and deleted; what happens to briefs at completion is still open in `∆YQb`.

## Retrospective

The log was designed in one session and accepted in the same session, with the usual
reviewer (the maintainer) reading it alongside sixteen other items. One question at
planning time removed most of the item. Worth asking of every mechanism before filing it:
what would the agent get wrong without this, given everything it can already read? The
answer here was "nothing", and the question costs a minute.
