---
id: ∆z3V
serves:
  - readable-backlog
  - agent-ready-work
written: 2026-09-19
commit: 2633dad
---

# Proposal files

## Value

The overseer gets a backlog short enough to read at a glance. Agents keep the detail they
need to do the work, in a file written while the author still had the context.

## Serves

- `readable-backlog`: detail leaves the backlog, so an item can be one sentence.
- `agent-ready-work`: the detail is kept, in a known place, for the agent that picks the
  item up cold.

## Scope and constraints

- Every backlog item gets a proposal. The default directory is `docs/proposals/` and the
  file is named `∆foo-slug.md`, like a journal entry; the same slug is reused for the
  journal entry later.
- Sections:
  - **Value**: who benefits and what they get. User value does not have to mean end-user
    value: the beneficiary can be one component of the code that uses another.
  - **Serves**: what that value serves. The link and its checking arrive with `∆q4w`.
  - **Scope and constraints**: binding. Without this section, a constraint would sit among
    suggestions the implementer may ignore.
  - **Implementation suggestions**: optional. They do not go into detail about the expected
    implementation; the implementer is free to ignore them when conditions have changed.
- The rule is uniform, so that agents and `lint` need no judgment about exemptions. The risk
  is filler, so the writing reference must say that a small item's proposal can be three
  lines, and show one.
- Where the item sentence and the proposal disagree, the proposal is authoritative.
- A proposal does not replace the planning phase, which happens just before implementation.
- Deliverables: spec text in `SKILL.md`; `references/writing-proposals.md`; the `add` action
  writes the proposal together with the item; an adopter log entry (`∆uTy`).
- Not in this item: the scaffold command (`∆mzU`), the value chain (`∆q4w`), the authoring
  reference rewrite (`∆VyU`), what happens at completion (`∆LNK`).

## Implementation suggestions

- Start the writing reference from `docs/proposals/README.md`, and take examples from the
  `∆NLi` write-up.
