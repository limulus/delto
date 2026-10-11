---
name: delto
description: >-
  Delto BACKLOG.md lifecycle skills. Use when modifying the backlog; prioritizing work;
  retrospectives; distilling journal lessons into agent memory; or when user references a
  “deltoid” (backlog item ID): i.e. `∆u2o`, `∆5Fn`, etc.
metadata:
  author: limulus
  version: '1.1.0'
---

# Delto

Delto is a way of keeping a human readable backlog alongside the code.

## The delto spec

This specification will help you understand if the project being worked on uses delto, and
if so, how you are expected to interact with `BACKLOG.md`, its backlog items, and journal
entry files.

### The backlog…

MUST be a Markdown file named `BACKLOG.md`.

MUST open with a short preamble that says the backlog is managed with the delto skill,
linking to `https://github.com/limulus/delto`. The preamble SHOULD NOT restate this spec;
it MUST state what the project does differently, such as a journal directory other than
`docs/journal/`.

MUST be organized as initiatives, in priority order, each holding work items directly or
grouped under epics.

### Initiatives…

MUST be a `##` heading followed by a description of at most one paragraph.

MUST start with `## Refactors`, a standing initiative that is kept even when it has no
items.

### Epics…

MAY group an initiative’s work items. An epic is a `###` heading, optionally followed by a
description of at most one paragraph.

### Work items…

MUST be a Markdown list item that starts with a deltoid followed by a title: a short phrase
on one line that names the work.

MAY have a description as a sub-bullet, of at most two lines.

MAY have a `needs:` sub-bullet that lists the deltoids of the items it depends on.

MUST be claimed when the work it represents has started.

MUST be removed from `BACKLOG.md` after the work it represents has been completed and
accepted, per the user’s work acceptance preferences.

### Briefs…

MAY exist for a work item, to hold what does not fit in it: its value, background, scope
and constraints, and implementation suggestions.

MUST be written only from what the user has said or decided, in conversation or in
writing. With no such context, no brief is written. Where the context does not settle
something the brief has to say, the user MUST be asked; an agent MUST NOT fill the gap by
inference.

MUST be a Markdown file named like `∆7hy-frobnicator-post-endpoint.md`, placed in either
`docs/briefs/` or a directory otherwise specified by the user.

MUST be folded into the item's journal entry and deleted when the item is completed.

### Deltoids…

MUST start with a `∆` followed by 3 alphanumeric characters. i.e. they match
`/^∆[a-zA-Z0-9]{3}$/`.

MUST be unique within the scope of the project.

MUST be rendered as monospace in HTML and Markdown. e.g. using backticks in Markdown or the
`<code>` tag in HTML.

MUST be left bare in YAML frontmatter, filenames, and commit subjects.

MAY be referenced by humans (and only humans) more loosely. e.g. “delta for F6” may be the
user referring to `∆4f6` or `∆4F6` using voice to text.

### Journal entries…

MUST be written when a backlog item is completed.

MUST be a Markdown document containing YAML frontmatter with: an `id` field
containing the deltoid (including the `∆` sigil); a `completed` field containing the
completion datetime in `YYYY-MM-DD HH:MM:SS ±HH:MM` format using the system’s timezone.

MUST be placed in either `docs/journal/` or a directory otherwise specified
by the user.

## Backlog example

```markdown
# Backlog

This backlog is managed with the [delto](https://github.com/limulus/delto) skill. Consult
it before adding or changing items.

## Refactors

Standing initiative. Keep it first, even when it has no items.

## Frobnication

Let users reticulate splines from the browser.

### API

- `∆7hy` Frobnicator POST endpoint
  - Accepts a spline payload and enqueues reticulation, because sync responses proved too
    slow.

### UI

- `∆jjA` Set up frontend framework
- `∆s9F` Frobnicator affordance UI element
  - The button and progress indicator that call the endpoint.
  - needs: `∆7hy`, `∆jjA`
```

## The `@limulus/delto` tool

This Node.js tool helps with deterministic backlog tasks.

### Invocation

```sh
npx @limulus/delto@1 <subcommand>
```

Include the major version from the skill metadata.

### Subcommands

#### `--help`

`delto --help` lists all subcommands and basic usage; `delto <subcommand> --help` gives
detailed help on a specific subcommand.

#### `bootstrap`

Use in a project that has no `BACKLOG.md` yet. Materializes the starter files — a
`BACKLOG.md` with its preamble and the Refactors initiative, a journal README, and a
`.gitignore` entry for the claim ledger — and refuses to run where a `BACKLOG.md`
already exists.

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
`∆7hy-frobnicator-post-endpoint.md`. It transcribes the item's text from `BACKLOG.md` into
the entry and never edits `BACKLOG.md` itself, so run it while the item is still present.

#### `lint`

Use to check `BACKLOG.md` structural integrity: duplicate deltoids (including reuse of a
completed journal entry's id), unresolved `needs:` references, `needs:` dependency cycles,
and oversized items. You must specify a journal entry directory using `--journal-dir`.
Read-only — it reports violations and exits non-zero without editing anything; fixing the
backlog is your job.

## Projects on older conventions

The conventions in this skill change over time, and a project may have been set up under
earlier ones. The project's `BACKLOG.md` preamble and its existing items show what the
project follows; work in that form. Where its files differ from the spec, they are
not errors. Offer once per conversation to bring the project up to date with the `migrate`
action, and never migrate without being asked.

## User requests

The user may directly activate this skill with `/delto <action>`. If they don’t specify an
action you should ask for clarification and suggest possible actions.

The user may also indirectly activate these actions. Use your judgment to determine if a
user request is related to delto and which action it corresponds to.

### `bootstrap`

The user wants to start using delto in a project that has no `BACKLOG.md`. Run the
`bootstrap` tool to materialize the starter `BACKLOG.md`, journal README, and
`.gitignore` entry, then offer to `add` the user's first backlog items.

### `add`

The user wants a new item in the backlog — they may give you full text or just a rough
description of the work.

**Stop and read [how to write backlog items](references/authoring-backlog-items.md) before
you mint or write anything.** This is a hard prerequisite, not a suggestion. That reference
_is_ the authoring procedure: how to mint the deltoid, how to write the title and
description, when and how to write a brief, where the item belongs, and when a `needs:`
edge is honest. Authoring from memory is exactly how items come out subtly wrong —
unreadable at a glance, poorly placed, carrying bogus `needs:`. Read it, then follow it.

### `plan`

The user is looking to plan an item from the backlog. If they do not specify an item, use
the `surface` tool to find an eligible item. Then `claim` that item and begin planning it.
You should consider using planning tools or skills available to you.

Look in the briefs directory for the item's brief. If it has one, read it first: its scope
and constraints bind the plan, and its suggestions are checked against the current code.
Where the item and its brief leave a question open, ask the user; do not guess. Write the
plan in plain language, with deep technical detail in a section of its own.

### `complete`

The user is accepting the work that has been done. Run the `complete` tool and fill in the
journal entry it creates. You should follow whatever workflow the user wants, or your system
prompt tells you to do, when completing work, like potentially making a commit.

Order matters. Run `complete` **while the item is still in `BACKLOG.md`** — the tool reads the
item from the backlog and transcribes it into the journal entry, so it must still be there.
Only once the entry is written should you remove the item from `BACKLOG.md`. Doing it the
other way around leaves `complete` with nothing to transcribe.

If the item has a brief, fold its content into the journal entry and delete the brief, so
the journal keeps why the work was done and what constrained it.

### `distill`

The user wants the lessons buried in completed-work journal entries folded into the
project's agent instructions file (`CLAUDE.md`, `AGENTS.md`, …) so future sessions inherit
them. This is a periodic pass: a datetime watermark in the journal README marks how far
previous runs got, and only entries completed since need review.

**Stop and read [how to distill journal entries](references/distilling-journal-entries.md)
before you review or edit anything.** That reference _is_ the procedure: where the
watermark lives, how to list the entries a run must review, what counts as a durable
lesson, and why every concrete claim gets verified against current code before it is
written. Distilling from memory is how stale guidance gets laundered into instructions
files. Read it, then follow it.

### `migrate`

The user wants a project set up under earlier conventions brought up to date with this
skill, or wants to know what that would involve.

**Stop and read [how to migrate an older project](references/migrating-older-projects.md)
before you change anything.** That reference _is_ the procedure: how to find what differs
from the spec, the order to apply changes in, which steps are mechanical and which need the
user's judgment, and the notes on changes whose migration is not obvious from the spec.
Migrating from memory is how a project gets rewritten in one pass with no chance to say
stop. Read it, then follow it.
