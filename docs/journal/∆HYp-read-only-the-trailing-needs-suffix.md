---
id: ∆HYp
completed: 2026-10-11 09:24:43 -07:00
---

## Backlog item

> - `∆HYp` `surface` stops listing an item as eligible while a prerequisite is open, because
>   the parser reads only the needs suffix that ends an item

## Value

An agent asking for work is never offered an item whose prerequisite is still open. Serves
`agent-ready-work`: an agent is only offered work whose prerequisites are done.

## Planning

`suffixIds` in `src/lib/backlog.ts` read the first needs suffix it found in an item. An item
whose prose quoted the suffix form got the quoted ids as its dependencies and lost its real
ones. The brief's case was reproduced again before planning: an item quoting a suffix on
`∆zzz` and ending with a real suffix on `∆aaa` was listed as eligible while `∆aaa` was
open. When `∆zzz` was a live item, `lint` reported nothing.

The brief's scope line said `suffixIds` "reads only the suffix that ends the item", and its
suggestions offered two ways to do that: anchor the match to the end of the item, or take
the last match. The two are not the same rule, so the maintainer chose between them:

- **Last suffix (chosen).** The last `; needs:` in the item counts. An item that quotes a
  suffix and has no real one still gets the quoted ids, so it is held back wrongly.
- **Strict suffix (rejected).** A `; needs:` counts only if nothing but id lists follows
  it. A real suffix followed by a note, such as `; needs: ∆aaa (once shipped)`, would be
  dropped silently and the item would look eligible. That is the harm this item exists to
  prevent, so the rule that errs towards holding an item back was preferred.

Both rules, and the old one, were run over every item in the backlogs and journals of
delto, lemmon, and menschen: 234 items, 63 with a needs suffix. All three rules gave the
same result for every item, so neither choice changed an existing project.

## Refinement

- **The change is one pattern.** A greedy `.*` in front of the existing pattern makes the
  match the last one. The item body is already joined into one line, so `.` reaches all of
  it.
- **A following segment still ends the id list.** menschen has eight items of the form
  `; needs: ∆a; touches: ∆b`. The existing test for a suffix followed by another labelled
  segment covers them and was left as it was.
- **Two tests, both seen failing first:** `suffixIds` on a body that quotes one suffix and
  ends with another, and `surface` on a two-item backlog in which the second item must be
  held back.
- **Checked against real projects:** `surface --json` for delto, lemmon, and menschen was
  captured before the change and was byte-identical after it.
- **Known gap, not filed:** an item that quotes a suffix with ids and has no real suffix is
  still read as depending on those ids. No item in the 234 does this.
- No skill text, template, or migration note changed, as the brief said.

## Retrospective

The brief's scope line and its implementation suggestions disagreed without saying so: one
suggestion met the scope line exactly and the other only in the reproduced case. Planning
caught it because each suggestion was tried against an item with no real suffix, not only
against the reproduced one. The survey of real items was cheap and turned the choice from a
guess about how people write suffixes into a count.
