# How to author delto BACKLOG.md items

The user reads the backlog to see where the work stands, so an item has to be readable at a
glance. An agent reads it later with none of today's context, so it also has to say what
the work is.

## Mint the deltoid first

Run `delto mint --journal-dir <dir>` before writing anything. The journal directory matters:
it lets the tool avoid colliding with deltoids from completed work, not just live items.
Adding several items at once? Mint them together with `--count <n>` so they stay mutually
distinct.

## Write the item

```markdown
- `∆7hy` Frobnicator POST endpoint
  - Accepts a spline payload and enqueues reticulation, because sync responses proved too
    slow.
  - needs: `∆jjA`
```

- **Title.** The deltoid, then a short phrase that names the work, on one line. It is what
  the user scans, so use the words they would use for the work. No trailing punctuation and
  no detail.
- **Description.** One sub-bullet of at most two lines: what the work is, and why it
  matters in a clause. Leave it out when the title says enough. It is self-contained: no
  pronouns pointing at today's conversation, no "as discussed", no relative dates.
- **Nothing else.** No design and no implementation detail; those belong in the plan made
  when the item is claimed.

## Pass known context down in a brief

A brief holds what the backlog item cannot: the value of the work, its background, its scope
and constraints, and any implementation suggestions. Whether to write one depends on a
single question: is there known context that whoever plans and does the work will need? If
the user has given you that context, in conversation or in writing, write the brief. If not,
write the item alone, then offer once to take down a brief if the user has context to pass
on. Do not press; a quick capture should stay quick.

An agent given a title and a blank page will produce a plausible brief, and the next agent
will treat it as the user's intent. Nothing in the brief marks which parts the user said and
which parts were guessed, so a guess binds the plan as firmly as a decision. That is why a
brief records only what the user has said or decided, and never what you infer:

- Every statement traces to the conversation, to something the user wrote, or to something
  you verified in the code and the user agreed matters.
- When the context does not settle something the brief has to say (who benefits, what is
  out of scope, which of two readings is meant), ask the user. Do not pick one.
- Show the user the brief when you write it.

Save the brief as `∆xxx-slug.md` in the briefs directory (`docs/briefs/` unless the project
says otherwise). The item does not link to it; the deltoid in the filename is the link. The
same slug is reused for the journal entry later. Use only the sections you have content
for:

```markdown
# Short title

## Value

Who benefits, and what is different for them afterwards. One to three plain sentences, with
no mechanism and no file names.

## Background

The problem as it is today, the evidence, and the reasoning.

## Scope and constraints

- What the work must cover, and what it must not break. Binding on the plan.

## Implementation suggestions

- Optional ideas. The planner checks them against the current code and may drop them.
```

Where an item and its brief disagree, the brief is authoritative; fix the item.

## Place it

- Put the item under the best-fitting epic within the initiative its work supports. If no
  epic fits, add one; add a whole initiative only for a genuinely scope-bounded milestone.
  An initiative or epic description is one paragraph at most.
- Refactoring work goes under the standing `## Refactors` initiative.
- Append by default. Document order is priority order, so place an item earlier only when
  it truly outranks what is already there.

## Set `needs:`

A `needs:` sub-bullet, placed last, lists hard logical prerequisites: the item cannot be
built until those ship. It is the only dependency mechanism in the spec, so keep it honest:
"would be nicer afterwards" is sequencing, not a `needs:`, and belongs in priority order
instead. `surface` trusts these edges to decide what is eligible, so a bogus edge hides
real work.

Your context window holds the conversation that produced this item, not the whole backlog.
Dispatch a subagent to read the entire `BACKLOG.md` against the new item's text and report:

- existing items the new work genuinely cannot start without (candidate `needs:`)
- existing items that cannot start without the new one (their `needs:` should gain the new
  deltoid)
- any existing item that already covers this work — a near-duplicate means refining that
  item, not adding a new one

Apply its findings yourself; the subagent reports, you edit.

## Before you finish

Reread the item as the user scanning the file: the title fits on one line and names the
work, and the description is at most two lines. Then run `delto lint` to check that the
deltoid is unique and every `needs:` reference resolves.
