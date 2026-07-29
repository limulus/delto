---
id: ∆Tmp
completed: 2026-07-29 14:14:48 -07:00
---

## Backlog item

> - ∆Tmp `delto bootstrap` + bundled templates (under `src/lib/templates/`) — materialize
>   into a fresh consumer project, refusing to overwrite: a starter `BACKLOG.md` whose header
>   names the delto skill as authoring authority (as this backlog's does), a journal README
>   seeding the ∆O6H distillation-watermark section so consumers inherit both conventions,
>   and a `.gitignore` entry for the `.delto-claims.local.jsonl` claim ledger

## Planning

The item was re-scoped in conversation before it was claimed: a gap review flagged that
the two named artifacts weren't enough — the first `claim` in a bootstrapped repo drops
`.delto-claims.local.jsonl` with nothing telling consumers to ignore it — and that
"materialize into a fresh project" needed an explicit refusal contract. ∆Tmp was amended
(`364bd1c`) to name the `.gitignore` entry and refuse-to-overwrite before implementation,
still within the 5-line cap.

Three forks worth recording:

- **Templates are TS render functions, not bundled `.md` assets.** `tsc` never emits
  non-TS assets into `dist`, and shipping raw markdown would have leaned on the accident
  that `files` includes `src`. `renderBacklog`/`renderJournalReadme` compile like any
  other module — zero build or packaging changes — and template parameters (`journalDir`,
  the watermark) become typed arguments instead of token replacement. The hazard is
  recorded on `renderBacklog` itself: nothing in the rendered text may start a line with
  `- ∆xxx `, or `parseBacklog` would see a phantom item in every consumer repo; a test
  locks that in.
- **The watermark seeds with bootstrap time.** Three options: omit the distillation
  section (contract-clean — the distill reference treats a missing section as "first
  run" — but it defeats the item's purpose, since the section is how consumers discover
  distillation exists); ship a `never` sentinel (invents a third watermark state the
  reference doesn't define); or stamp bootstrap time via the existing `formatCompleted`
  (vacuously true, since at bootstrap the journal is empty). Stamping won. The case where
  it could lie — bootstrapping over a repo that already has entries — can't arise:
  bootstrap refuses when `BACKLOG.md` exists and skips an existing README.
- **The `.gitignore` no-op check is an exact whole-line match, not a parser.** Raised
  again in review ("should this use a real `.gitignore` parser?"): deliberately no. A
  parser would skip the append when a consumer's `*.jsonl`-style glob happens to cover
  the ledger, leaving its ignore status silently dependent on someone else's pattern; the
  explicit comment + pattern block survives refactors of unrelated globs, and the worst
  case is one redundant append, idempotent thereafter. Even a parser isn't the real
  oracle (`git check-ignore` is — but bootstrap deliberately works before `git init`).
  If it ever matters: consult `git check-ignore -q` when `.git` exists, not a parser
  dependency.

Layout followed the house split: pure logic in `src/lib/` (`templates/`, `gitignore.ts`),
all I/O in `src/bin/bootstrap.ts` on the `mint.ts` skeleton. One ordering subtlety is
commented in the bin: the cwd `BACKLOG.md` check must precede the `findRepoRoot` walk-up,
because the walk-up matches cwd's own backlog too — inverting them would turn every
refusal into a nested-backlog warning. `--journal-dir` (default `docs/journal`) came
along for CLI consistency with `mint`.

## Refinement

- Every module went red→green; all four mutation checks failed exactly their intended
  guard; coverage held at 100/100/100/100, `verify` green.
- `test:pack` gained a bootstrap-from-the-packed-tarball smoke, extended red-first before
  the subcommand was registered. A manual end-to-end in a temp dir ran the full
  lifecycle — bootstrap → mint → surface → claim → complete — with the ledger invisible
  to git and re-bootstrap refusing with exit 1.
- The routing eval ([[∆CTB]] methodology; `docs/experiments/bootstrap-skill-eval.md`):
  3/3 sandboxes produced correct artifacts; both with-skill runs routed to the tool,
  including from indirect phrasing that never said "delto"; the append path held
  byte-exactly on a real tracked `.gitignore`. The no-skill baseline is contaminated —
  the offline npm remap note exposed the checkout's skill prose — so the skill-vs-no-skill
  lift is unmeasured; a clean datum needs a substrate that hides the checkout (e.g. a
  shim binary on PATH).
- difit review: nine seed comments, one reviewer question (the parser fork above),
  resolved as designed.

## Retrospective

Two lifecycle misses, both worth more than the code lessons:

- The implementing session committed straight to local `main` instead of branching
  first — noticed only when the user asked. The commits did reach `origin/main` in the
  end, but branch-first is the rule ([[∆Bpr]] protects main for a reason).
- The session was deleted before `/delto complete` ran, leaving the ∆Tmp claim stale in
  the ledger and no journal entry — a live specimen of the ∆diJ gap (nothing surfaces
  claim age). This entry was reconstructed afterward by mining the deleted session's
  transcript out of `~/.claude/projects/`; recoverable, but only because the transcript
  survived the UI deletion. Completing the delto lifecycle belongs in the definition of
  done, not the follow-up.

Left open deliberately: the skill frontmatter `version` stayed at `1.0.0` (decide whether
the new routing trigger is a skill-surface rev), and neither the `git check-ignore`
upgrade nor the clean-baseline substrate was filed — both are YAGNI until they bite.
