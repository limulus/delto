---
id: ∆YQb
serves:
  - ∆z3V
  - ∆8YP
  - ∆LNK
  - maintainable-delto
written: 2026-09-19
commit: 2633dad
---

# ADR-002: short items, briefs, and value chains

## Value

Whoever plans an item in this initiative finds the design questions it shares with other
items already answered in one place. Two items are then not built on different answers, and
later maintainers can see why the design is the way it is.

## Background

Several questions cut across the items: where outcomes live, what happens to a brief when
its item is completed, how a `serves` link relates to the needs graph. If each planner
answers them locally, the answers will conflict.

## Serves

- `∆z3V`, `∆8YP`, `∆LNK`: each depends on a decision recorded here (the shape of a brief,
  where outcomes live, what happens to a brief at completion).
- `maintainable-delto`: a recorded rationale keeps later changes from undoing decisions by
  accident.

## Scope and constraints

Record these as decided on 2026-09-19; do not reopen them without a new reason:

- In Markdown prose a deltoid is written in backticks; not in YAML, filenames, `[[∆foo]]`
  links, commit subjects, or CLI output. Old journal entries are not rewritten.
- The item form is "`∆foo`: sentence", followed by the needs suffix with backticked ids.
  One plain-language sentence, two wrapped lines at most.
- Every item gets a brief with these sections: a plain value statement from the
  beneficiary's side, optional background, serves, binding scope and constraints, and
  optional suggestions. A small item's brief can be a few lines. The brief is
  authoritative over the item sentence.
- The per-item files are called "briefs" (decided 2026-09-20; they were first called
  proposals). A proposal is tentative, stops being an accurate name once work starts, and
  invites writing that argues for the work. A brief gives whoever does the work the goal
  and the constraints, and leaves the method to them.
- There is no "v2" of the skill or the spec. The skill's metadata version selects the CLI
  major, which stays 1 because every CLI change here is additive; an adopter cannot stay on
  an old skill version; and the conventions change in steps that one version jump cannot
  describe. The adopter change log numbers its entries, and those numbers are the only
  version the conventions have (`∆uTy`).
- Project settings live in `BACKLOG.md` frontmatter, including the number of the last
  adopter-log entry the project has applied (`∆Wak`).
- The top-level statements are called "outcomes", and one may be maintainer-facing.
- The parser reads both item forms, so the CLI stays on major version 1.
- `mint` keeps the full alphabet, look-alike characters included.
- Ids stay case-sensitive (decided 2026-09-20, when `∆hIw` was retired; see its journal
  entry). When a spoken id fits more than one item, the agent asks which one is meant.
- The duplicate check opens a brief only where item text suggests significant overlap.
- The overseer is shown an item's value chain at `plan` and at `add` (`∆iXR`).

Settle these:

- Where outcomes live and how they are identified. Provisional: `docs/outcomes.md`, slugs.
- What happens to a brief when its item is completed or retired. Chains that pass
  through a completed item must still resolve. This ties in with `∆Af6` (retiring items).
- How a brief's `serves` link relates to the needs graph. In this directory most
  `serves` links between items mirror a needs edge in reverse (`∆SwZ` serves `∆cCz`, which
  needs `∆SwZ`). Decide whether to derive one from the other, cross-check them in `lint`,
  or keep them independent.
- Whether `serves` may list several targets, as several files here do.
- `∆Z3W`: whether items must be Markdown bullets. The parser requires it; the spec says MAY.
- Whether the spec in `SKILL.md` keeps its "v1.0" label now that the label does not track
  compatibility. The journal README template, ADR-001, and this backlog's Someday/Maybe
  section cite it.

Output: `docs/decisions/002-….md`, and the ADR list in `CLAUDE.md` updated.

## Implementation suggestions

- Follow ADR-001's structure.
- One lifecycle option: `complete` moves the brief into the journal directory and appends
  the journal sections, so exactly one file named `∆foo-slug.md` exists at any time and
  links to it keep resolving.
- Use `∆NLi`'s findings and this directory's provisional files as evidence.
