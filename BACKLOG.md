# Delto Backlog

This backlog is managed with the **delto** skill — before adding or changing items, consult
it (and the authoring reference it points to) so the conventions below stay enforced.

Organized as Initiative (`##`) → Epic (`###`) → Item (`-`); initiatives are roughly
priority-ordered, items 5 lines max. Refactors stays pinned at the top as a standing
top-priority initiative.

Each item starts with a 3-char alphanumeric ID prefixed `∆` (e.g. `- ∆OID Notify route —
…`). These “deltoids” are immutable and travel with the item into its final
`docs/journal/∆OID-slug.md` entry so cross-references stay stable. To mint a collision-free
deltoid, run `delto mint --journal-dir docs/journal` (see `delto mint --help`).

Hard prerequisites use a trailing `; needs: ∆OID[, ∆OID]` suffix — logical blockers, the
only dependency mechanism in the `/delto` SKILL.md spec (v1.0).

## Refactors

Standing initiative — do not remove, even if no items.

## Beyond the v1.0 spec

New capabilities the `/delto` `SKILL.md` spec (v1.0) does not call for, promoted from
Someday/Maybe 2026-07-01. They grow the skill and CLI surface (per ADR-001, `--help` is
that contract) without changing the v1.0 format spec; only ∆O6H's watermark convention
might eventually earn a spec mention.

- ∆O6H `distill` subskill — review journal entries added since a commit-SHA watermark
  (kept in the journal README, advanced with the instructions-file edits) and fold durable
  lessons into the project's agent instructions file (`CLAUDE.md`, `AGENTS.md`, …),
  verifying each claim against current code first, so retrospective lessons reach future
  sessions instead of staying buried. Proven manually on menschen 2026-07-01
- ∆PZ3 `delto lint` — a `BACKLOG.md` structural linter (duplicate IDs, unresolved
  `needs:` references, dependency cycles, oversized items): deterministic pass/fail checks,
  distinct from the LLM-driven `refine` activity the skill owns. Last shipped as the legacy
  `refine-backlog`/`lint-backlog.ts`, now in Git history
- ∆Tmp `delto bootstrap` + bundled templates — a starter `BACKLOG.md` and
  `docs/journal/README.md` under `src/lib/templates/`, materialized into a fresh
  consumer project. The starter `BACKLOG.md` header should name the delto skill as its
  authoring authority (as this backlog's does), and the journal README should seed the
  distillation-watermark section (∆O6H) so consumers inherit both conventions

## `/delto add` authoring quality

Small tweaks to the skill's `references/authoring-backlog-items.md`, each validated by
direct observation in the ∆CTB eval. (The measure-first anchor ∆GJ3 was retired
2026-07-01 — see its journal entry.)

- ∆2hh Broaden the authoring-reference duplicate check to flag work already *shipped* in the
  CLI/code, not only work already *filed* in the backlog — `references/authoring-backlog-items.md`
  warns only about backlog near-duplicates today. In the ∆CTB eval an agent caught an
  already-implemented `surface --json` flag only on its own initiative (via `--help`); one
  explicit clause would standardize it. Distinct from ∆dlO's separate review workflow.
- ∆IUb Scope the authoring reference's "Dispatch a subagent to read the entire BACKLOG.md"
  mandate to large backlogs or a full context window — it is unconditional today, but in the
  ∆CTB eval 3 of 5 add runs sensibly read a small backlog inline. Conditioning it would match
  the guidance to the good behavior agents already exhibit instead of prescribing skipped overhead.

## Lifecycle gaps

Behavior the `/delto` skill or tools assume but nothing documents — surfaced by a
2026-07-01 gap review of the backlog.

- ∆VP7 Document a `refine` subskill in the `/delto` SKILL.md — the skill's description
  advertises "prioritizing work; retrospectives" and ∆PZ3 calls refine "the LLM-driven
  activity the skill owns", yet User requests documents only add/plan/complete, so backlog
  reworks (like 2026-07-01's) run unguided. Route inline with the procedure in `references/`,
  following the `add` pattern. Distinct from ∆dlO's multi-agent deep-review spike.
- ∆Af6 Sanction the retire-without-completing convention — the spec and skill cover only
  completion, so dropping an item cold is improvised each time (∆GJ3 was journaled via
  `complete` and hand-marked retired, following ∆Bpr's superseded note). Add skill prose:
  journal the retirement decision via `complete`, mark the entry retired, then remove the
  bullet. Consider a spec clause when the spec next revs.
- ∆diJ Give stale claims a recovery story — `.delto-claims.local.jsonl` is cleared only by
  `release`/`complete`, so a crashed agent's claim hides its item from `surface`
  indefinitely, and nothing reports claim age. Smallest fix is a documented recovery path
  in the skill (inspect via `surface --json`, then `release`); weigh age reporting or
  expiry in the tools only if prose proves insufficient.

## Someday/Maybe

Work the current `/delto` `SKILL.md` spec (v1.0) does not call for. Parked until a spec
revision or concrete user need brings it back.

- ∆dlO Spike: deep backlog-quality review — a dynamic multi-agent workflow that analyzes
  each item against the repo (git, code, journal), not just the backlog text, to catch what
  `delto lint` (∆PZ3) can't: stale premises, already-done work, satisfied/implicit `needs:`,
  semantic duplicates, missing "why", spec/code drift. The LLM-judgment counterpart to
  ∆PZ3's deterministic checks; proposes fixes for human approval. Not in the v1.0 spec
- ∆Stb `delto status` — a read-only progress report (per-initiative remaining work,
  eligible tasks, critical path). Last shipped as the legacy
  `backlog-status`/`report-status.ts`, now in Git history; not in the v1.0 spec
- ∆Pli Distribute delto as a Claude Code plugin so the `/delto` skill and the `delto`
  binary install together from a plugin marketplace, rather than `npx skills add` +
  `npx @limulus/delto@1` as separate steps
- ∆oJF GUI to visualize the backlog and journal — render the `needs:` graph, what's
  eligible, and completed-item history in a browser instead of plain text. Not in the
  v1.0 spec
- ∆rTJ Spike: repo-wide unique deltoids across multiple `BACKLOG.md`s in a monorepo.
  Decide whether deltoids are unique repo-wide (discover every `BACKLOG.md` + its journal
  dir — default `docs/journal/` relative to each, overridable via YAML frontmatter) or
  only per-backlog. Today `mint` scans the nearest backlog but resolves `--journal-dir`
  against the cwd, so it can miss in-flight ids and collide
- ∆NOp Spike: reconsider parallel-work collision detection (the removed `touches:` edge) —
  what signal actually predicts a merge collision, and whether it earns the backlog
  bookkeeping. The original symmetric same-file graph was undocumented and needs rethinking
- ∆Z3W Spike: reconcile backlog-item recognition with the spec — the spec says items MAY be
  Markdown list items, but `parseBacklog` matches only `^- ∆xxx `, so every subcommand requires
  bullets today. Decide whether to relax the parser, leave item extraction to the LLM, or
  tighten the spec to require bullets. Surfaced by the ∆Rdm/SKILL.md review.
