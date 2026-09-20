# Proposals

Provisional — this directory dogfoods the "Short readable items" initiative in
`BACKLOG.md` before the spec and tooling for it exist. ADR-002 (`∆YQb`) settles the final
shape, and `∆8n4` brings these files in line with it.

One file per live backlog item, named `∆xxx-slug.md` like its future journal entry. The
backlog holds one sentence per item; the proposal holds the rest. Where the two disagree,
the proposal is authoritative.

## Shape

- **Frontmatter**: `id` (the deltoid); `serves` (a list of deltoids and outcome slugs from
  `docs/outcomes.md`); `written` and `commit` (the date and commit the proposal was written
  against, so a planner can tell how stale it is).
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

A small item's proposal can be a few lines. A proposal does not replace planning: plan the
item just before implementing it.

In Markdown prose a deltoid is written in backticks. In frontmatter and filenames it is
bare.
