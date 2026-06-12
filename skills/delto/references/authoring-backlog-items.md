# How to author delto BACKLOG.md items

A backlog item is a promise to a future reader — likely an agent with none of today's
context. Write it so that reader can pick it up cold, months from now, and know what to
build and why it matters.

## Mint the deltoid first

Run `delto mint --journal-dir <dir>` before writing anything. The journal directory matters:
it lets the tool avoid colliding with deltoids from completed work, not just live items.
Adding several items at once? Mint them together with `--count <n>` so they stay mutually
distinct.

## Write the text

Start with the deltoid, then a short imperative phrase naming the work, then just enough
prose to stand alone:

```markdown
- ∆7hy Frobnicator POST endpoint — accept a spline payload and enqueue reticulation,
  so the UI (∆s9F) has something to call. Sync responses proved too slow in the ∆2qX spike.
```

- **Terse.** Respect the backlog's own line limit if it declares one; 2–3 lines is a good
  default. State the *what*, not a design — implementation detail belongs in the plan that
  happens at claim time, not the backlog. The richer the context you hold, the harder you
  must compress: the why is one clause, not everything you know.
- **Self-contained.** No pronouns pointing at today's conversation, no "as discussed", no
  relative dates. Name files, endpoints, and decisions explicitly. The reader has the repo
  and the backlog — nothing else.
- **Capture the why.** The what tells a reader how to do the work; the why tells them
  whether it is still worth doing, and lets them make good judgment calls when reality has
  drifted from the item. One clause is often enough: what prompted this, what it unblocks,
  or what breaks without it.

## Place it

Read the backlog's header — a delto backlog self-documents its conventions (hierarchy,
line limits, journal directory). Typically:

- Put the item under the best-fitting epic within the initiative its work supports. If no
  epic fits, add one; add a whole initiative only for a genuinely scope-bounded milestone.
- Append by default. Document order is priority order, so place an item earlier only when
  it truly outranks what is already there.

## Set `needs:`

`; needs: ∆aaa[, ∆bbb]` marks hard logical prerequisites — the item cannot be built until
those ship. It is the only dependency mechanism in the spec, so keep it honest: "would be
nicer afterwards" is sequencing, not a `needs:`, and belongs in priority order instead.
`surface` trusts these edges to decide what is eligible, so a bogus edge hides real work.

Your context window holds the conversation that produced this item, not the whole backlog.
Dispatch a subagent to read the entire `BACKLOG.md` against the new item's text and report:

- existing items the new work genuinely cannot start without (candidate `needs:`)
- existing items that cannot start without the new one (their `needs:` should gain the new
  deltoid)
- any existing item that already covers this work — a near-duplicate means refining that
  item, not adding a new one

Apply its findings yourself; the subagent reports, you edit.

## Before you finish

Reread the item as the cold reader: deltoid matches `∆` + 3 alphanumerics, the why is
present, every `needs:` reference resolves to a live item, and nothing depends on context
that lives only in your head.
