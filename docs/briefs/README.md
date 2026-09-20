# Briefs

Provisional — this directory dogfoods the "Short readable items" initiative in
`BACKLOG.md` before the spec and tooling for it exist. ADR-002 (`∆YQb`) settles the final
shape, and `∆8n4` brings these files in line with it.

One file per live backlog item, named `∆xxx-slug.md` like its future journal entry. The
backlog holds one sentence per item; the brief holds the rest. Where the two disagree,
the brief is authoritative.

## Shape

- **Frontmatter**: `id` (the deltoid) and `serves` (a list of deltoids and outcome slugs
  from `docs/outcomes.md`).
- **Value**: one to three plain sentences from the beneficiary's side: who they are and
  what is different for them afterwards. The beneficiary may be another component or an
  agent, not the end user. No mechanism and no file names. The first sentence stands on its
  own, because the value chain display (`∆iXR`) prints it. Test: could the overseer repeat
  it to someone else after reading it once?
- **Background**: optional. The problem as it is today, the evidence, and the reasoning.
- **Serves**: one sentence per `serves` entry saying why the link holds. Every chain of
  `serves` links must end at an outcome.
- **Scope and constraints**: binding. What the work must cover and what it must not break.
- **Implementation suggestions**: optional and not binding. Check each one against the
  current code before adopting it, and drop what no longer fits.

A small item's brief can be a few lines. A brief does not replace planning: plan the
item just before implementing it.

In Markdown prose a deltoid is written in backticks. In frontmatter and filenames it is
bare.

## Template

Copy this, save it as `∆xxx-slug.md`, and fill it in. Delete the Background and
Implementation suggestions sections when there is nothing to put in them.

```markdown
---
id: ∆xxx
serves:
  - an-outcome-slug-or-a-deltoid
---

# Short title

## Value

Who benefits, and what is different for them afterwards. One to three plain sentences.

## Background

The problem as it is today, the evidence, and the reasoning.

## Serves

- `an-outcome-slug-or-a-deltoid`: why the link holds, in one sentence.

## Scope and constraints

- What the work must cover, and what it must not break. Binding.

## Implementation suggestions

- Optional ideas. The implementer checks them against the current code and may drop them.
```
