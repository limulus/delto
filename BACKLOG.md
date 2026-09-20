# Delto Backlog

This backlog is managed with the **delto** skill — before adding or changing items, consult
it (and the authoring reference it points to) so the conventions below stay enforced.

Organized as Initiative (`##`) → Epic (`###`) → Item (`-`); initiatives are roughly
priority-ordered, items 5 lines max. Refactors stays pinned at the top as a standing
top-priority initiative. The initiative "Short readable items, each with a brief"
follows its own item format, described in its intro.

Each item starts with a 3-char alphanumeric ID prefixed `∆` (e.g. `- ∆OID Notify route —
…`). These “deltoids” are immutable and travel with the item into its final
`docs/journal/∆OID-slug.md` entry so cross-references stay stable. To mint a collision-free
deltoid, run `delto mint --journal-dir docs/journal` (see `delto mint --help`).

Hard prerequisites use a trailing `; needs: ∆OID[, ∆OID]` suffix — logical blockers, the
only dependency mechanism in the `/delto` SKILL.md spec (v1.0).

## Refactors

Standing initiative — do not remove, even if no items.

## Short readable items, each with a brief

Rework the item format so the human maintainer can read the backlog at a glance: deltoids
in backticks, one plain-language sentence per item, and the detail moved to a per-item
brief that states the item's user value and traces it to a top-level outcome.
Placed ahead of the older initiatives 2026-09-19 because it rewrites the files they tweak
(the spec, the authoring reference, the starter templates). It can ship in two steps:
backticks (`∆SwZ`, `∆cCz`), then short items with briefs, outcomes, and value chains as
one package.

This is not a "v2" of the skill or the spec (decided 2026-09-19). An adopter who installs
or updates the skill gets whatever is at Git HEAD, and the conventions change in steps. So
each item here that changes what an adopting project's files look like adds a numbered
entry to the adopter change log (`∆uTy`), and a project records the last entry it has
applied (`∆Wak`).

This initiative dogfoods its own format ahead of the tooling. Each item is one sentence of
at most two lines, with backticked ids in its needs suffix. Its detail is in
`docs/briefs/∆OID-slug.md` (shape in `docs/briefs/README.md`); the brief is
authoritative and must be read before the item is planned. The outcomes that briefs
trace to are in `docs/outcomes.md`. Items keep the bare item prefix until `∆SwZ` lets the
parser read the backticked one.

### Groundwork

- ∆uTy An agent opening an older delto project understands it and guides its migration,
  because the skill ships a numbered log of adopter-facing changes and a `migrate` action
- ∆NLi We learn whether one plain sentence can carry an item, and what its brief must
  hold, by rewriting a sample of lemmon's backlog items
- ∆YQb The items in this initiative share one answer to the questions that cut across
  them, because ADR-002 records the design and settles what is open; needs: `∆NLi`
- ∆Wak Agents and the CLI learn a project's directories, line cap, and how far it has
  migrated from `BACKLOG.md` frontmatter, not from flags on every call; needs: `∆uTy`

### Items and briefs

- ∆HYp `surface` stops listing an item as eligible while a prerequisite is open, because
  the parser reads only the needs suffix that ends an item
- ∆hIw A deltoid spoken aloud names exactly one item, because `mint` stops issuing ids that
  differ from an existing one only in case
- ∆SwZ Projects can start writing items as "`∆foo`: sentence", because the parser accepts
  that form alongside the bare one
- ∆cCz Deltoids are easy to spot and hard to misread, because the spec, skill, and starter
  templates write them in backticks; needs: `∆uTy`, `∆SwZ`
- ∆z3V The backlog stays short without losing detail, because every item gets a brief
  holding its value, scope, and suggestions; needs: `∆YQb`, `∆uTy`
- ∆mzU Briefs have a consistent shape and show how old their suggestions are, because
  the CLI scaffolds them; needs: `∆z3V`, `∆Wak`
- ∆8YP Every item's value has something to trace to, because each project states its
  top-level outcomes, drafted by the skill for the user to correct; needs: `∆YQb`, `∆uTy`
- ∆q4w Work that serves no outcome becomes visible, because every brief names what it
  serves and `lint` checks that the chain ends at an outcome; needs: `∆z3V`, `∆8YP`, `∆mzU`
- ∆iXR The overseer can judge an item's value before approving work, because the CLI prints
  its value chain and the `plan` and `add` actions show it; needs: `∆q4w`
- ∆VyU Agents write items a human can read at a glance, because the authoring reference
  teaches one plain sentence within two lines; needs: `∆cCz`, `∆z3V`
- ∆LNK Journal entries keep the reason the work was done, because `complete` carries the
  item's brief into them; needs: `∆z3V`, `∆Wak`

### Planning

- ∆2QZ The human approving a plan can understand it, because the `plan` action asks for
  plain language with deep technical detail in its own section
- ∆vvd Plans use what the brief's author knew and still fit the current code, because
  `plan` reads the brief, holds to its scope, and checks its suggestions; needs: `∆z3V`

### Migrate delto itself

- ∆8n4 Adopters get a migration guide that has already been used on a real project, because
  delto's own backlog is migrated by following it; needs: `∆uTy`, `∆VyU`, `∆q4w`

## `/delto add` authoring quality

Small tweaks to the skill's `references/authoring-backlog-items.md`, each validated by
direct observation in the ∆CTB eval. (The measure-first anchor ∆GJ3 was retired
2026-07-01 — see its journal entry.)

- ∆gmz Emit a one-line authoring-guide reminder from `mint` — on stderr so stdout keeps its
  bare-deltoid contract, pointing at the skill's `references/authoring-backlog-items.md`
  without hardcoding an install path. Reaches agents SKILL.md's ∆WyS read-gate can't (minting
  via CLAUDE.md, `--help`, or no-skill setups, per the ∆Hp7 baseline), at the ideal moment:
  after minting, right before writing. Precedent: `complete`'s "Next:" nudge.
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
- ∆diJ Document claim visibility and stale-claim recovery — nothing tells agents that
  `surface --json` lists claimed items, so they read `.delto-claims.local.jsonl` directly
  (observed 2026-07-14); and since only `release`/`complete` clear the ledger, a crashed
  agent's claim hides its item from `surface` indefinitely with no claim age reported.
  Skill prose first; weigh age reporting/expiry in tools only if prose proves insufficient.

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
  v1.0 spec. Prior art to review first: unmerged branches `mockups/base` (a shared
  `experiments/backlog-gui/` server) and three UI variants atop it —
  `mockups/{1-backlog-cockpit,2-journal-ledger,3-lifecycle-flow}`, branched 2026-06-01
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
