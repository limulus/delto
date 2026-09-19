---
id: ∆HYp
serves:
  - agent-ready-work
written: 2026-09-19
commit: 2633dad
---

# Read only the trailing needs suffix

## Value

Agents choosing work through `surface`. `suffixIds` in `src/lib/backlog.ts` reads the first
needs suffix it finds in an item. An item whose prose quotes the suffix form gets the quoted
ids as its dependencies and loses its real ones. Reproduced on 2026-09-19: an item quoting a
suffix on `∆zzz` and ending with a real suffix on `∆aaa` was listed as eligible while `∆aaa`
was open. `lint` reported it only because `∆zzz` did not exist; had the prose quoted a live
id, nothing would have been reported. One-sentence items make a quoted suffix more likely.

## Serves

- `agent-ready-work`: an agent is only offered work whose prerequisites are done.

## Scope and constraints

- `suffixIds` reads only the suffix that ends the item.
- A regression test reproducing the case above, seen failing first.
- Not adopter-facing, so no adopter log entry. `fix:` commit.

## Implementation suggestions

- Anchor the match to the end of the item body, or take the last match.
