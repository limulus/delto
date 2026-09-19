---
id: ∆8YP
serves:
  - ∆q4w
written: 2026-09-19
commit: 2633dad
---

# Top-level outcomes

## Value

The overseer and every proposal author. A value chain needs somewhere to end. The outcomes
are the project's own statement of who it serves and what they get.

## Serves

- `∆q4w`: every chain of `serves` links ends at an outcome.

## Scope and constraints

- Each project states the few benefits (about three to seven) it exists to give the people
  it serves. Each has a stable identifier and one or two sentences. An outcome is never
  completed.
- One outcome may be maintainer-facing, for example "the code stays cheap to change safely".
  CI, refactors, and dependency updates then trace to it directly, not through a contrived
  chain to end users.
- The skill drafts the outcomes from the README, backlog, and journal, and the user corrects
  the draft. Editing a draft is easier than answering an interview from a blank page. A new
  project with nothing to read gets a short interview: who uses it, what they can do with
  it that they could not before, what would make them stop.
- Timing: offered at `bootstrap` and skippable; otherwise raised when the first item has
  nothing to trace to. It never blocks a user who only wants a backlog.
- The outcomes are the user's statement. An agent drafts them; it does not add or change one
  without asking.
- Location and identifiers follow ADR-002 (`∆YQb`).
- Adopter log entry (`∆uTy`): the migration drafts outcomes from the project's existing
  initiatives and journal.

## Implementation suggestions

- `docs/outcomes.md` in this repo is a worked example.
