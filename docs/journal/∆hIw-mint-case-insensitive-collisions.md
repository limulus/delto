---
id: ∆hIw
completed: 2026-09-20 08:06:03 -07:00
---

> **Retired without being built (2026-09-20).** No code changed under this item; this entry
> records the decision to drop it. The item wanted `mint` to stop issuing ids that differ
> from an existing one only in case, so that an id spoken aloud could only mean one item.
> The maintainer's judgment: a spoken id that fits two items is rare, and when it happens
> the agent can ask which one is meant. That is why the spec tells agents that humans may
> refer to deltoids loosely — so the agent knows a spoken id may be inexact and asks when
> more than one fits. Making written ids unique when case is ignored would cost four fifths
> of the keyspace, a fix to `mint`'s capacity guard, and a new `lint` check, to prevent
> something a question resolves. Ids stay case-sensitive. If ambiguous spoken ids ever
> become a real nuisance, file a fresh item citing this one rather than reviving ∆hIw.

## Backlog item

> - ∆hIw A deltoid spoken aloud names exactly one item, because `mint` stops issuing ids that
>   differ from an existing one only in case, and `lint` reports any that a merge brings in

## What prompted it

On 2026-09-19 `mint` issued `∆ctb` while [[∆CTB]] exists in the journal. The spec allows
loose human references ("delta for F6" may mean `∆4f6` or `∆4F6`), and the agent that saw
the pair filed this item on the reasoning that such references only work while no two ids
differ in case alone.

## What the investigation found

Measured on 2026-09-20, before any code was written:

- Usable ids would fall from 62³ = 238,328 to 36³ = 46,656. Letter case would then add
  visual variety and no capacity. What can be told apart when spoken is 46,656 either way.
- That would still be ample: `mint` sees 75 ids in delto after four months (about 230 a
  year) and 86 in lemmon after five weeks. Neither has a pair differing only in case.
- `mint`'s capacity guard computes 62³ minus the number of taken ids. Under the rule it
  would let a request through after the usable ids ran out, and the draw loop would never
  end.
- `mint` can only check ids it can see. Two branches minting at the same time could still
  produce a case-only pair, 6.2 times as likely as an exact duplicate (1 in 38,339 for each
  pair of ids, against 1 in 238,328), and `lint` has no check for it. The guarantee would
  have needed a new `lint` check to hold across branches.

The numbers are worth keeping for any later question about the size of the id space. With
ids case-sensitive, as they remain, the space is 238,328 and an exact duplicate from two
branches is what `lint` already catches.

## Retrospective

The item was filed by an agent on its own initiative and framed as a defect. It was a
judgment about what the spec's loose-reference clause is for, and that should have been
raised as a question to the maintainer, who knew the answer: the clause exists so the agent
asks. Measuring the cost before planning was cheap and is what made the decision easy.

This is the first item with a brief to be retired. Its brief was folded into this entry and
deleted, so that no brief is left for an item that is not live — one data point for
`∆YQb`'s open question about what happens to a brief when its item is completed or retired.
