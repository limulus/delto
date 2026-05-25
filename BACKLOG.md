# Delto Backlog

Organized as Initiative (`##`) → Epic (`###`) → Item (`-`); initiatives are roughly
priority-ordered, items 5 lines max. Refactors stays pinned at the top as a standing
top-priority initiative.

Each item starts with a 3-char alphanumeric ID prefixed `∆` (e.g. `- ∆a7B Notify route —
…`). These “deltoids” are immutable and travel with the item into its final
`docs/journal/∆xxx-slug.md` entry so cross-references stay stable. When creating new items
use the `/delto-add` skill, falling back to:

```sh
while id=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 3); \
  grep -rq "∆$id" BACKLOG.md docs/journal/; do :; done; echo "∆$id"
```

Hard prerequisites use a trailing `; needs: ∆xxx[, ∆yyy]` suffix — logical blockers.
Same-area collisions use `; touches: ∆xxx[, ∆yyy]` so parallel work knows to coordinate.

## Refactors

Standing initiative — do not remove, even if no items.

- ∆7sR Reconcile `src/bin/` ↔ `skills/<name>/` divergence — `src/bin/mint-id.ts` and
  `skills/add-backlog-item/mint-id.ts` are drifted copies (the in-`skills/` version still
  has the menschen-relative `..` import paths and was committed verbatim from the
  originating project). Pick one as the source of truth and delete or generate the other;
  touches: ∆bSx, ∆IsK, ∆HmI
- ∆HmI Move the claim ledger to a `.gitignore`d file alongside `BACKLOG.md` (currently
  `.claude/skills/plan-backlog-item/claims.local.jsonl`) — use the `find-up` package to
  locate the backlog and derive the ledger path; touches: ∆7sR

## First npm Publish

Foundational initiative — what `@limulus/delto` needs before it can be published with
real library exports, full test coverage, and a working consumer story.

### Library API

- ∆iDx Replace `src/lib/Example.ts` and the `src/index.ts` placeholder with the real
  public surface — `parseBacklog`, `computeEligibility`, `journalIds`, `claimedIds`,
  `claim`, `release`, plus the `BacklogItem` / `ItemEligibility` / `EligibilityResult`
  types. Delete `Example.ts`; touches: ∆bSx
- ∆bSx Decide and document the bin-script shipping shape — bundled npm `bin`
  entrypoints, a single `delto` CLI router, or files copied into the consumer's
  `.claude/skills/<name>/` by the install step. Capture the decision so ∆Sre and
  ∆IsK have something to build against; touches: ∆iDx, ∆IsK, ∆7sR

### Skill Packaging

- ∆Rnm Rename the five skills to the `/delto-*` namespace — `add-backlog-item →
  delto-add`, `plan-backlog-item → delto-plan`, `complete-backlog-item →
  delto-complete`, `refine-backlog → delto-refine`, `backlog-status →
  delto-status`. Update each `SKILL.md` `name:`, the directory names, and any
  cross-references; touches: ∆IsK
- ∆IsK Package the skill files so `npx skills add @limulus/delto/<name>` works —
  directory layout, `SKILL.md` frontmatter, and any manifest `skills add` expects.
  Each of the five skills installable individually; needs: ∆bSx, ∆Rnm;
  touches: ∆7sR, ∆bSx, ∆Rnm

### Testing & QA

- ∆Lcv Unit tests for the library at 100% coverage — `src/lib/backlog-parser.ts`,
  `src/lib/eligibility.ts`, `src/lib/claims-ledger.ts`. Vitest's threshold is
  already 100/100/100/100, so the tests are the gate; needs: ∆iDx
- ∆Bcv Tests for the bin scripts — exercise `mint-id`, `find-eligible-tasks`,
  `lint-backlog`, `report-status`, and `complete-item` against fixture `BACKLOG.md`
  / `docs/journal/` trees to hit 100% coverage; needs: ∆Lcv, ∆bSx

### Packaging & Release

- ∆Rdm Real README — replace the `Class` / `method()` placeholders with what delto
  actually is, the consumer workflow (`/delto-bootstrap` then `npx skills add …`),
  and one paragraph per skill; needs: ∆IcL, ∆IsK
- ∆Sre Verify `semantic-release` produces the expected `@limulus/delto` tarball —
  `bin` entries (if any), `files`, `exports`, type definitions, the bundled
  templates, and the skill directories addressable by `npx skills add`;
  needs: ∆iDx, ∆bSx, ∆Tmp, ∆IsK
- ∆Bpr Enable GitHub branch protection on `main` — require PR + passing CI before
  merge so an accidental push (e.g. an agent in YOLO mode) cannot trigger an
  unreviewed publish

## Consumer Onboarding

The consumer experience that turns a fresh (or existing) repo into one ready to use
the backlog-tooling skills.

### Bootstrap Skill & Templates

- ∆Tmp Bundle the consumer-facing templates with the package — a starter
  `BACKLOG.md` (this file's header structure, parameterized by project name) and a
  `docs/journal/README.md` (template + workflow). Source of truth for
  `/delto-bootstrap`; touches: ∆IcL
- ∆IcL `/delto-bootstrap` skill — scaffolds `BACKLOG.md` and
  `docs/journal/README.md` from the bundled templates when absent; on an existing
  `BACKLOG.md` that lacks delto's conventions, mints IDs for un-IDed items and
  proposes Initiative / Epic groupings. One skill, both modes; needs: ∆Tmp;
  touches: ∆Tmp

### Getting Started

- ∆Gsd Getting-started docs — install, `/delto-bootstrap`, `npx skills add` for
  each of the five skills, and how the lifecycle ties together (add → plan →
  complete → refine). Link from the README; needs: ∆IcL, ∆IsK

## Future Enhancements

### Distribution

- ∆Pli Distribute delto as a Claude Code plugin so consumers can install the
  skills (and the `/delto-bootstrap` command) directly from a plugin marketplace
  rather than via the `npx skills add` route
