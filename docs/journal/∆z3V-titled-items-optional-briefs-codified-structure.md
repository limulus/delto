---
id: ∆z3V
completed: 2026-10-11 16:27:29 -07:00
---

## Backlog item

> - `∆z3V` Titled items, optional briefs, codified structure
>   - Items get a one-line title with description and `needs:` sub-bullets; briefs come only
>     from the user's context; the spec defines Initiative, Epic, and Work Item.

## Value

The maintainer can come back to a `BACKLOG.md` after time away and see where the work
stands from the titles alone.

## Background

Decided by the maintainer on 2026-10-11, replacing the earlier plan for this initiative
(one-sentence items, a brief for every item, top-level benefits, and value chains, spread
over nine items).

- The work was too broken down, and the meta work on delto was getting in the way of real
  work on other projects. It became one item.
- Even a two-line item made a backlog hard to read on returning to it.
- A brief written by an agent with no context from the maintainer is extrapolation.

## Scope and constraints

- A work item is a deltoid and a one-line title, with an optional description sub-bullet
  of at most two lines and an optional `needs:` sub-bullet. An item does not link to its
  brief; the deltoid in the brief's filename ties them together.
- The older trailing `; needs:` suffix still parses, so projects that have not migrated
  keep working.
- Briefs are optional. An agent writes one only from context or discussion with the
  maintainer. With no prior context, no brief is written. Where the context does not
  settle something the brief has to answer, the maintainer is consulted.
- What decides whether an item gets a brief is whether there is known context to pass down
  to whoever plans and does the work.
- An initiative description is at most one paragraph.
- The `BACKLOG.md` preamble is short. It links delto to its repository, and names the
  journal directory only when that is not the default.
- The skill's spec codifies the structure: Initiative, Epic, Work Item. The Refactors
  initiative is standard.
- The skill and its references say "user", not "maintainer".
- A migration runs all at once when the user has asked for it; the user then reads the
  full diff.
- No evals. The maintainer evaluates the change by using it.
- The parser change is published before the skill text reaches Git HEAD.

## Planning

There was no separate plan. The maintainer stated the changes, the format and three open
decisions were proposed in one message, and the maintainer agreed to all of them:

- **Format.** A plain title on the item line, then sub-bullets. The `needs:` sub-bullet
  keeps the title line clean, and a line that starts with `needs:` cannot be confused with
  prose that quotes the form, which was the ambiguity `∆HYp` patched for the suffix.
- **The value chain was dropped.** With briefs optional, `lint` cannot check that every
  item traces to a benefit. `∆8YP`, `∆q4w`, `∆iXR`, `docs/benefits.md`, and the briefs
  folder that `bootstrap` would have created (`∆mzU`) all went.
- **Four items became skill text:** the authoring reference (`∆VyU`), `complete` folding
  the brief into the journal entry (`∆LNK`), plans in plain language (`∆2QZ`), and `plan`
  reading the brief (`∆vvd`).
- **Older items kept their text.** Each got a title and a two-line description; where the
  original text did not fit, it was moved unchanged into a brief.

## Refinement

- **Parser.** `parseBacklog` collects the text of a `needs:` sub-bullet, including its
  wrapped lines. When an item has one, it is the only source of the item's needs; otherwise
  the suffix is read as before. `surface --json` for lemmon and menschen was unchanged.
- **An older CLI fails in the unsafe direction.** The published 1.2.0 ignores a `needs:`
  sub-bullet and reports a blocked item as eligible. The migration note tells an agent to
  compare `surface --json` before and after moving the suffixes.
- **Starter template.** `bootstrap` writes a two-line preamble and `## Refactors`. The
  journal directory is stated only when `--journal-dir` is not `docs/journal`.
- **`∆Z3W` was removed without its own entry.** The spec now requires a work item to be a
  Markdown list item, which is one of the answers that spike was to choose between.
- **Changes from the maintainer's review of the first draft:**
  - The preamble links delto to its repository.
  - A `[Brief](…)` sub-bullet on each item was added and then removed: it repeated on
    every item in the rendered file.
  - A separate `writing-briefs.md` reference was merged into the authoring reference,
    because it was required reading for `add` and cost an extra round trip.
  - The `plan` action's text on briefs was cut from two paragraphs to four lines.
  - "Most items do not need a brief" was replaced with the question of whether there is
    known context to pass down. An agent with none offers once to take a brief down.
  - The reason for the rule now leads the rule: a guessed brief reads the same as a decided
    one, so the next agent treats the guess as the user's intent.
  - The skill's `version` went to `1.1.0`, and "(v1.0)" was dropped from the spec heading
    and the journal README template.
- **Not done:** lemmon and menschen are still in the older form. `lint` does not check the
  title or the two-line description; it still enforces only the five-line cap.

## Retrospective

The earlier plan for this initiative, begun on 2026-09-19, had nine items and a dozen
briefs open when it was replaced, and most of that was thrown away here. Doing the whole
change in one sitting, with the maintainer reading a working draft and correcting it,
settled in a day what the item-by-item plan had not. The brief link is the example: it was
cheap to try and obvious to reject once rendered.
