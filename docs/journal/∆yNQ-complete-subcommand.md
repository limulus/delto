---
id: ∆yNQ
completed: 2026-05-29 06:10:39 +00:00
---

## Backlog item

> - ∆yNQ Build `delto complete <deltoid> <journal-entry-path>` — port
>   `complete-backlog-item`'s logic to `src/lib/` + `src/bin/complete.ts` test-first:
>   release the claim and scaffold a journal entry at the path with `id` + `completed`
>   (`YYYY-MM-DD HH:MM:SS ±HH:MM`) frontmatter per the spec. Register in the router;
>   needs: ∆qBS

## Planning

The v1.0 `complete` is much leaner than the legacy `complete-item.ts` it ports. Two things
came out of reading ∆yNQ against the old script:

- **No title/slug derivation.** The caller now passes the full `<journal-entry-path>` and
  picks the filename — exactly the LLM-judgment job ∆uaD removed from the tool. `complete`
  just writes where it's told.
- **Spec frontmatter, not the old shape.** The entry carries `id` + `completed`
  (`YYYY-MM-DD HH:MM:SS ±HH:MM`), matching every existing journal and the SKILL.md spec,
  not the legacy `id`/`date`/`title`. The timestamp formatter (`formatCompleted`) lives in
  `src/lib/journal.ts` alongside the body scaffolder (`journalEntry`), both pure.

Dropped the legacy script's BACKLOG.md deletion-scope report (the epic/initiative-emptying
arithmetic). The v1.0 primitive's job is "scaffold the entry + release the claim"; pruning
the bullet — and any heading it empties — is agent judgment, which is exactly what I did to
this commit's BACKLOG.md (the now-empty `### Library & CLI` epic went with the last item).

## Refinement

- **`formatCompleted` is dep-free with an injected offset.** A date-library (date-fns
  `xxx`) would have produced the format in one call, but the repo runs on two runtime deps
  by design, and the timezone offset is the only fiddly part. Making `offsetMinutes`
  default from the date but injectable covers the `+`/`-` sign branches deterministically
  without a date dep and without touching the process tz — the same testable-seam approach
  used for `mint`'s RNG.
- **Safety is create-only.** `complete` refuses to overwrite an existing file and only ever
  creates a new entry + appends a release to the gitignored ledger — never destructive,
  even against a surprising nearest-BACKLOG.md.
- **Dogfooded on itself.** This entry was scaffolded by `node src/bin/cli.ts complete ∆yNQ
  docs/journal/∆yNQ-complete-subcommand.md` after a real `claim ∆yNQ`; the ledger shows the
  claim and the release `complete` appended. The frontmatter and blockquote above are the
  tool's actual output; only this prose is hand-written.

## Retrospective

Building `complete` last meant the whole `First npm Publish` "Library & CLI" epic could be
closed by the tool it produced — the strongest possible end-to-end proof, and the reason it
was worth finishing the four primitives in one pass. The three earlier entries were
hand-authored in the same format because the tool didn't exist yet; from here on, every
completion in this repo can run through `delto complete`.

One honest edge the tests pin but the happy path hides: `complete` requires the item to
still be in BACKLOG.md (it transcribes the bullet). That's the right default for the
normal flow (complete, then prune), but it means re-running after you've already removed
the bullet errors out — recoverable, and arguably correct, but worth remembering.

