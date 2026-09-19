---
id: ∆2QZ
serves:
  - informed-approval
written: 2026-09-19
commit: 2633dad
---

# Plans a newcomer can follow

## Value

The overseer approving a plan. A plan that assumes knowledge of the codebase cannot be
judged by someone who has not read that code recently, so the approval means little.

## Serves

- `informed-approval`: the overseer understands what they are approving.

## Scope and constraints

- The `plan` action in `SKILL.md` tells the planner to write for a reader who knows the
  product but not this part of the code, and not to assume much prior knowledge of the
  codebase.
- If the plan needs deep technical detail, that detail goes in its own section, after a
  plain-language summary and the steps.
- The skill defers to the harness's planning tools, so the instruction has to be a sentence
  or two of prose that still takes effect through them. Check by eval that it changes the
  plans produced.
- Independent of proposals; it can ship now. `docs(skill):` commit. It does not change an
  adopter's files, so it needs no adopter log entry.
