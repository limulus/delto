---
id: ∆z3V
serves:
  - readable-backlog
  - agent-ready-work
written: 2026-09-19
commit: 2633dad
---

# Item briefs

## Value

The overseer gets a backlog short enough to read at a glance. The agent that later picks up
an item still finds everything it needs to do the work, written down while the author had
the context.

## Background

Today an item has to carry its own detail, because nothing else does. That is why items grow
to five dense lines. Giving each item a file for its detail lets the item itself shrink to
one sentence.

## Serves

- `readable-backlog`: detail leaves the backlog, so an item can be one sentence.
- `agent-ready-work`: the detail is kept, in a known place, for the agent that picks the
  item up cold.

## Scope and constraints

- Every backlog item gets a brief. The default directory is `docs/briefs/` and the
  file is named `∆foo-slug.md`, like a journal entry; the same slug is reused for the
  journal entry later.
- The name is deliberate (decided 2026-09-20). A brief gives whoever does the work the goal
  and the constraints, and leaves the method to them. The files were first called
  proposals; that word is tentative, and it invites writing that argues for the work.
- Sections:
  - **Value**: one to three plain sentences from the beneficiary's side: who they are and
    what is different for them afterwards. No mechanism and no file names. The first
    sentence stands on its own, because `∆iXR` prints it. User value does not have to mean
    end-user value: the beneficiary can be one component of the code that uses another.
  - **Background**: optional. The problem as it is today, the evidence, the reasoning.
  - **Serves**: what that value serves. The link and its checking arrive with `∆q4w`.
  - **Scope and constraints**: binding. Without this section, a constraint would sit among
    suggestions the implementer may ignore.
  - **Implementation suggestions**: optional. They do not go into detail about the expected
    implementation; the implementer is free to ignore them when conditions have changed.
- The rule is uniform, so that agents and `lint` need no judgment about exemptions. The risk
  is filler, so the writing reference must say that a small item's brief can be three
  lines, and show one.
- An agent writing a brief drifts toward justifying the work. The first draft of this
  directory did: every Value section described a problem and argued for the work, and none
  said what the beneficiary gains (see `∆NLi`). The writing reference gives a test for the
  Value section: could the overseer repeat it to someone else after reading it once?
- Where the item sentence and the brief disagree, the brief is authoritative.
- A brief does not replace the planning phase, which happens just before implementation.
- Deliverables: spec text in `SKILL.md`; `references/writing-briefs.md`; the `add` action
  writes the brief together with the item; an adopter log entry (`∆uTy`).
- Not in this item: the scaffold command (`∆mzU`), the value chain (`∆q4w`), the authoring
  reference rewrite (`∆VyU`), what happens at completion (`∆LNK`).

## Implementation suggestions

- Start the writing reference from `docs/briefs/README.md`, and take examples from the
  `∆NLi` write-up.
