# How to migrate an older project

A project set up under earlier conventions keeps working as it is. `SKILL.md` describes
only the current contract; this reference is the one place in the skill that may describe
older files, so that an agent can recognize them and bring them up to date. Keep it for
that reason.

## Find what differs

Read the project's `BACKLOG.md` header and frontmatter, its journal directory's
`README.md`, and a sample of its items and journal entries. Compare each with the spec in
`SKILL.md`. Check the notes at the end of this reference for any difference they cover.

List every difference for the user: what the project has, what the spec expects, and what
changing it involves. Say which steps are **mechanical** (the same edit applied everywhere,
no decisions to make) and which need **judgment** (a decision per item, by you or by the
user). Show the list before changing anything.

## Apply in order

- One difference at a time, in dependency order: a change that others build on goes first
  (a setting before the files that use it; a directory before the files that go in it).
- Each step gets the user's agreement before it runs. A mechanical step can run across the
  whole project at once. A judgment step runs in batches small enough for the user to
  review as it goes.
- After each step, update the `BACKLOG.md` header (and frontmatter, if the project has
  one) so it describes what the project now follows. A partly migrated project is valid as
  long as its header tells the truth.
- Journal entries are history. Do not rewrite them unless a note below says to.
- Stop where the user says to stop.
- Run `delto lint` at the end.

## Notes on specific changes

A change gets a note here only when its migration is not obvious from the spec, or when
older and current files look alike but mean different things. Each note is dated, says how
to recognize the older form, and says what to do about it.

There are none yet.
