# Delto Backlog

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

## First npm Publish

Foundational initiative — what `@limulus/delto` needs before it can be published: the
`delto` CLI subcommands the `/delto` `SKILL.md` documents (mint, surface, claim, release,
complete), full test coverage, and a working consumer story (skill install via `npx skills
add` + tool via `npx @limulus/delto@1`). Shape decisions captured in
[ADR-001](./docs/decisions/001-delto-cli-and-skill-shape.md).

### Packaging & Release

- ∆fb2 Publish to the public npm registry, not GitHub Packages — drop the
  `publishConfig.registry` (`npm.pkg.github.com`) override and update the `cd.yaml` publish
  job's registry + auth token so `npx @limulus/delto@1` resolves from public npm. Surfaced by
  the ∆Rdm review.
- ∆29K Go public before the first publish — the single owner of making the project public:
  choose and add a LICENSE (currently `UNLICENSED`) and flip the GitHub repo from private to
  public. Surfaced by the ∆Rdm review.
- ∆Bpr Enable GitHub branch protection on `main` — require PR + passing CI before merge
  so an accidental push (e.g. an agent in YOLO mode) cannot trigger an unreviewed
  publish
- ∆LwK Post-publish consumer smoke — once the first release lands, confirm `npx
  @limulus/delto@1 <sub>` resolves the `@1` tag from the public npm registry and runs on a fresh
  checkout, and `npx skills add <git-ref>` installs `skills/delto` from the pushed ref. ∆IsK
  verified both locally (tarball install + local skill add); this covers the
  live-registry/pushed-ref half; needs: ∆Sre, ∆fb2

### Skill Quality

- ∆Xtj Evidence that `skills/delto/references/authoring-backlog-items.md` improves
  agent-written backlog items — blind A/B eval (synthesized menschen prompts, Opus and
  Sonnet cohorts with/without the reference, Fable 5 judges; report in
  `docs/experiments/authoring-reference-eval.md`), then fold the findings back into the
  reference — bdf1c03 landed the doc on argument alone, this measures it

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
  consumer project; not in the v1.0 spec
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
