# How to migrate an older project

A project set up under earlier conventions keeps working as it is. `SKILL.md` describes
only the current contract; this reference is the one place in the skill that may describe
older files, so that an agent can recognize them and bring them up to date. Keep it for
that reason.

## Find what differs

Read the project's `BACKLOG.md` preamble, its journal directory's
`README.md`, and a sample of its items and journal entries. Compare each with the spec in
`SKILL.md`. Check the notes at the end of this reference for any difference they cover.

List every difference for the user: what the project has, what the spec expects, and what
changing it involves. Say which steps are **mechanical** (the same edit applied everywhere,
no decisions to make) and which need **judgment** (a decision per item, by you or by the
user). Show the list before changing anything.

## Apply in order

- One difference at a time, in dependency order: a change that others build on goes first
  (a setting before the files that use it; a directory before the files that go in it).
- Once the user has agreed to the list, run each agreed step across the whole project,
  whether it is mechanical or needs judgment. Do not stop for approval between steps
  unless the user asked for that.
- After each step, update the `BACKLOG.md` preamble so it describes what the project now
  follows. A partly migrated project is valid as long as its preamble tells the truth.
- Journal entries are history. Do not rewrite them unless a note below says to.
- Stop where the user says to stop.
- Run `delto lint` at the end, then show the user the full diff to read and correct before
  anything is committed.

## Notes on specific changes

A change gets a note here only when its migration is not obvious from the spec, or when
older and current files look alike but mean different things. Each note is dated, says how
to recognize the older form, and says what to do about it.

### Deltoids in backticks (2026-10-10)

Older form: items start with a bare id (`- ∆7hy Frobnicator POST endpoint`), and the ids in
needs suffixes and in the `BACKLOG.md` header's examples are bare too.

What to do: put each of those ids in backticks. This is mechanical. Do not rewrite journal
entries. `delto lint` prints the item count; run it before and after. A lower count
afterwards means the CLI in use cannot read backticked items, so update it before going on.

### Titled items and a short preamble (2026-10-11)

Older form: an item is one paragraph of up to five lines, with its dependencies in a
trailing ``; needs: `∆aaa` `` suffix. The `BACKLOG.md` preamble documents the conventions
(hierarchy, line limit, deltoids, the needs suffix). There may be no `## Refactors`
initiative, and initiative descriptions may run to several paragraphs.

What to do, in this order:

1. Check the CLI. An older CLI ignores a `needs:` sub-bullet and reports a blocked item as
   eligible. Save the output of `delto surface --json` before step 2 and compare it
   afterwards; if the eligible list grew, update the CLI before going on.
2. Move each needs suffix to a `needs:` sub-bullet. Mechanical.
3. Give each item a title and cut its description to two lines. This needs judgment.
   Where an item's text does not fit, move the whole original text, unchanged, into a brief
   under `## Background`. Do not add to the text or rewrite it; it is the only context you
   have.
4. Replace the preamble with the short form in the spec, keeping only what the project does
   differently. Add `## Refactors` as the first initiative. Cut each initiative description
   to one paragraph.

Do not rewrite journal entries.
