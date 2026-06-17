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

### `/delto add` authoring quality

- ∆GJ3 Measure how often `/delto add <text>` makes an agent *perform* the request instead of
  filing an item before investing in a fix — then likely downgrade. The ∆Hp7 menschen eval
  filed 3/3 novel imperative adds (incl. the no-skill baseline); with ∆CTB that's 0 failures
  in 4. A dedicated repeated-trial run on menschen should confirm the near-zero rate; if it
  does, retire this. Only if real, fix (SKILL.md framing, action-routing cues, or tooling).
- ∆2hh Broaden the authoring-reference duplicate check to flag work already *shipped* in the
  CLI/code, not only work already *filed* in the backlog — `references/authoring-backlog-items.md`
  warns only about backlog near-duplicates today. In the ∆CTB eval an agent caught an
  already-implemented `surface --json` flag only on its own initiative (via `--help`); one
  explicit clause would standardize it. Distinct from ∆dlO's separate review workflow.
- ∆IUb Scope the authoring reference's "Dispatch a subagent to read the entire BACKLOG.md"
  mandate to large backlogs or a full context window — it is unconditional today, but in the
  ∆CTB eval 3 of 5 add runs sensibly read a small backlog inline. Conditioning it would match
  the guidance to the good behavior agents already exhibit instead of prescribing skipped overhead.

## Someday/Maybe

Work the current `/delto` `SKILL.md` spec (v1.0) does not call for. Parked until a spec
revision or concrete user need brings it back; logic for the first two survives in Git
history (the legacy skill scripts that held it were removed by ∆Rnm).

- ∆PZ3 `delto lint` — a `BACKLOG.md` structural linter (duplicate IDs, unresolved
  `needs:` references, dependency cycles, oversized items): deterministic pass/fail checks,
  distinct from the LLM-driven `refine` activity the skill owns. Last shipped as the legacy
  `refine-backlog`/`lint-backlog.ts`, now in Git history; not in the v1.0 spec
- ∆dlO Spike: deep backlog-quality review — a dynamic multi-agent workflow that analyzes
  each item against the repo (git, code, journal), not just the backlog text, to catch what
  `delto lint` (∆PZ3) can't: stale premises, already-done work, satisfied/implicit `needs:`,
  semantic duplicates, missing "why", spec/code drift. The LLM-judgment counterpart to
  ∆PZ3's deterministic checks; proposes fixes for human approval. Not in the v1.0 spec
- ∆Stb `delto status` — a read-only progress report (per-initiative remaining work,
  eligible tasks, critical path). Last shipped as the legacy
  `backlog-status`/`report-status.ts`, now in Git history; not in the v1.0 spec
- ∆Tmp `delto bootstrap` + bundled templates — a starter `BACKLOG.md` and
  `docs/journal/README.md` under `src/lib/templates/`, materialized into a fresh
  consumer project. The starter `BACKLOG.md` header should name the delto skill as its
  authoring authority (as this backlog's does) so consumers inherit the self-reference;
  not in the v1.0 spec
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
