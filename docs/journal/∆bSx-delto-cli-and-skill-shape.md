---
id: ∆bSx
date: 2026-05-25
title: `delto` CLI and skill shape
---

## Backlog item

> - ∆bSx Decide and document the bin-script shipping shape — bundled npm `bin`
>   entrypoints, a single `delto` CLI router, or files copied into the consumer's
>   `.claude/skills/<name>/` by the install step. Capture the decision so ∆Sre and
>   ∆IsK have something to build against

## Planning

Picked up via `/plan-backlog-item`, which proposed ∆7sR (top of Refactors). I swapped to
∆bSx after realising ∆7sR's "pick a source of truth between `src/bin/` and
`skills/<name>/`" was the ∆bSx shipping-shape decision in disguise. Two parallel
sessions iterated on the design and converged on the same answer.

Three facts shaped the outcome and weren't obvious from the code:

- **`npx skills add` reads from a Git ref, not the npm tarball**, and copies one skill
  directory only — sibling `../lib/` imports are not pulled in. The existing
  `skills/<name>/*.ts` scripts were therefore already broken on install. The fix isn't
  reconciliation, it's deletion (∆7sR collapses into ∆Rnm).
- **Skills can be prose-only.** The `anthropic/skills` and `difit` precedents converge
  on `SKILL.md` as router + `--help` as contract — the binary owns the mechanical step,
  the agent owns the judgment.
- **`@<path>` inclusion doesn't work inside `SKILL.md`** (only inside user-typed
  prompts). A consumer-side stub that points back at the package's `SKILL.md` is not
  available, so the dedup-by-pointer route was ruled out. The remaining duplication
  question — where one `SKILL.md` text lives — is resolved by Git being the source of
  truth and the consumer's `.claude/skills/<name>/` being a copy that doesn't need to
  diverge.

The decision settled into single `delto` CLI router + single consolidated `/delto`
skill + `command -v X || npx X` fallback in `SKILL.md`. Captured as
[ADR-001](../decisions/001-delto-cli-and-skill-shape.md). I bundled the BACKLOG.md
rewrites that flow from it — adding ∆qBS, deleting ∆7sR and ∆IcL, merging ∆Gsd into
∆Rdm, rewriting ∆Rnm/∆IsK/∆Tmp/∆Bcv/∆Sre — into the same commit so the backlog and the
decision never drift apart.

## Refinement

The first ADR draft over-reached. Five corrections landed in one round of review:

- **No current-state references.** The Context section originally described the drifted
  trees, the broken `../lib/` imports, the symlink layer. Rewritten in conceptual terms
  — the two coupled questions the ADR answers, not the codebase mess that prompted them.
- **`∆OID` for placeholder deltoids.** BACKLOG.md header updated; new convention.
- **Not prescriptive about subcommands.** §1's table of six subcommands with one-line
  descriptions collapsed to a one-paragraph note naming them as "early candidates ...
  nothing in the rest of this ADR depends on that list." Several BACKLOG items lost
  their subcommand enumerations.
- **No `difit` attribution.** The `command -v X || npx X` idiom is a generic shell
  pattern, not a difit invention.
- **Library exports out of scope.** Dropped the orthogonal-library-surface subsection
  from the ADR, dropped `dist/esm/index.js` from the distribution table, dropped the
  ∆iDx hand-off in Consequences. ∆iDx remains a separate backlog item; its surface is
  its own concern.

Standardized references on `ADR-NNN` (with the dash) and captured that convention in
CLAUDE.md's new "Architecture Decisions" section. Reworded ∆Rnm and ∆HmI to drop their
"we are coming from somewhere" framing — both items now read as forward-looking work
rather than "consolidate the five legacy skills" / "move the ledger from its current
location."

## Retrospective

The install-channel investigation should have happened earlier. The fact that `npx
skills add` reads from Git surfaced from a parallel session as a heads-up rather than
from my own digging into the install path, and it materially reshaped the answer (it
meant the `files:` array doesn't gate the skill surface, and the existing scripts were
broken on install). Pattern to remember: when an ADR is about distribution, look at the
install channel mechanically before reasoning about the publish shape.

First-pass ADRs default to over-specifying. The library-export story and the
six-subcommand table both leaked implementation choices into a decision document that
should have stayed at the level of shape. Tighten to "what does the rest of the work
need to know" and let downstream items own the rest.

Prose-only `SKILL.md` + `--help` as the subcommand contract is the recurring pattern.
Worth defaulting to it for future skills without re-deriving.
