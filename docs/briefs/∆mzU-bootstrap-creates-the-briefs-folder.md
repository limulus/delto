---
id: ∆mzU
serves:
  - cheap-adoption
---

# `bootstrap` creates the briefs folder

## Value

Someone starting a new project with delto gets a briefs folder that already explains what a
brief contains and gives a template to copy. An agent writing a brief there runs no command:
it copies the template and fills it in.

## Background

This item first included a subcommand that generated a brief's skeleton, as `complete` does
for journal entries. That half was dropped on 2026-09-20. A command is for work an agent
cannot do reliably by itself: `complete` releases a claim, copies the item verbatim, and
stamps an exact timestamp. A brief's skeleton is static headings plus an id the agent
already has. Generating it would cost three tool calls (run the command, read the file,
fill it in) where one write does the job, and the date and commit it would have stamped are
known to git, more accurately.

The journal shows that agents follow a template well however it reaches them: all but two
of 87 entries in delto and lemmon kept the scaffold's sections, and none left a TODO
comment behind.

## Serves

- `cheap-adoption`: a new project is set up correctly from its first command, and any agent
  working in it, with or without the skill, can find the template.

## Scope and constraints

- `bootstrap` creates the briefs directory, at the location configured in the `BACKLOG.md`
  frontmatter (`∆Wak`), with a README that describes the shape of a brief and contains a
  template to copy.
- The README is the project's own statement of the shape, as the backlog header and the
  journal README are. A project may customize it, and the skill's writing reference defers
  to it (`∆z3V`).
- An existing README is left untouched, as `bootstrap` already does for the journal README.
- The README text must not start a line the way a backlog item starts, in either item form.
- No subcommand generates briefs. `lint` checks that briefs are well-formed (`∆q4w`).
- The adopter log entry for briefs (`∆z3V`) has `migrate` create the same README in an
  existing project.
- `feat:` commit; the template ships in the tarball.

## Implementation suggestions

- Follow `src/lib/templates/journal-readme.ts` and how `src/bin/bootstrap.ts` writes it.
- `docs/briefs/README.md` in this repo is the starting text.
