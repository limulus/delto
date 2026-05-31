---
name: delto
description: >-
  Delto BACKLOG.md lifecycle skills. Use for adding, choosing, claiming, planning, refining,
  linking, and completing items; prioritizing work; retrospectives; or when user references
  a “deltoid” (backlog item ID): i.e. `∆u2o`, `∆5Fn`, etc.
metadata:
  author: limulus
  version: '1.0.0'
---

# Delto

Delto is a way of keeping a human readable backlog alongside the code.

## The delto spec (v1.0)

This specification will help you understand if the project being worked on uses delto, and
if so, how you are expected to interact with `BACKLOG.md`, its backlog items, and journal
entry files.

### The backlog…

MUST be a Markdown file named `BACKLOG.md`.

SHOULD self-document conventions like initiative/epic hierarchy, max item line count,
completion journal directory.

### Backlog items…

MUST start with a “deltoid”.

MAY have a `; needs: ` suffix that lists deltoids that the item depends on.

MAY be put in Markdown list items.

MUST be claimed when the work it represents has started.

MUST be removed from `BACKLOG.md` after the work it represents has been completed and
accepted, per the user’s work acceptance preferences.

### Deltoids…

MUST start with a `∆` followed by 3 alphanumeric characters. i.e. they match
`/^∆[a-zA-Z0-9]{3}$/`.

MUST be unique within the scope of the project.

MAY be referenced by humans (and only humans) more loosely. e.g. “delta for F6” may be the
user referring to `∆4f6` or `∆4F6` using voice to text.

### Journal entries…

MUST be written when a backlog item is completed.

MUST be a Markdown document containing YAML frontmatter with: an `id` field
containing the deltoid (including the `∆` sigil); a `completed` field containing the
completion datetime in `YYYY-MM-DD HH:MM:SS ±HH:MM` format using the system’s timezone.

MUST be placed in either `docs/journal/` or a directory otherwise specified
by the user.

## Backlog items examples

```markdown
- ∆7hy Frobnicator POST endpoint
- ∆jjA Set up frontend framework
- ∆s9F Frobnicator affordance UI element; needs: ∆7hY, ∆jjA
```

## The `@limulus/delto` tool

This Node.js tool helps with deterministic backlog tasks.

### Invocation

```sh
npx @limulus/delto@1 <subcommand>
```

Include the major version from the skill metadata.

### Subcommands

#### `help` or `--help`

List all subcommands and basic usage. Use `help <subcommand>` to get detailed help on a
specific subcommand.

#### `mint`

Use when adding new items to the backlog to create a unique new deltoid. You must specify a
journal entry directory using `--journal-dir` which will be used to ensure there are no
collisions with past work.

Use `--count <num>` to mint many at once.

#### `surface`

Use when trying to find a backlog item to work on. It traverses the backlog item dependency
graph to find work that is eligible to work on.

#### `claim <deltoid>`

Use when starting work on a backlog item to avoid stepping on someone else attempting to
work on the same item.

#### `release <deltoid>`

Use when abandoning a backlog item to release your claim on the work.

#### `complete <deltoid> <journal-entry-path>`

Use when completing work to release the claim and scaffold a journal entry Markdown file at
the given path. Unless the user has specified a different format, file names should be like
`∆7hy-frobnicator-post-endpoint.md`. It transcribes the item's bullet from `BACKLOG.md` into
the entry and never edits `BACKLOG.md` itself, so run it while the bullet is still present.

## User request

The user may directly activate this skill with `/delto <action>`. If they don’t specify an
action you should ask for clarification and suggest possible actions.

### `plan`

The user is looking to plan an item from the backlog. If they do not specify an item, use
the `surface` tool to find an eligible item. Then `claim` that item and begin planning it.

### `complete`

The user is accepting the work that has been done. Run the `complete` tool and fill in the
journal entry it creates. You should follow whatever workflow the user wants, or your system
prompt tells you to do, when completing work, like potentially making a commit.

Order matters. Run `complete` **while the item is still in `BACKLOG.md`** — the tool reads the
item's bullet from the backlog and transcribes it into the journal entry, so it must still be
there. Only once the entry is written should you remove the item's bullet from `BACKLOG.md`.
Doing it the other way around leaves `complete` with nothing to transcribe.
