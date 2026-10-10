---
id: ∆cCz
serves:
  - readable-backlog
---

# Backticked deltoids in the spec, skill, and starter templates

## Value

Someone reading a backlog or a journal entry can pick out item ids at a glance, and does not
mistake one id for another.

## Background

Backticks put a deltoid in a monospace font, which tells `I`, `l`, and `1` apart, and they
make the id stand out in a line of prose.

## Serves

- `readable-backlog`: ids are easy to spot and hard to misread.

## Scope and constraints

- Spec text in `SKILL.md`: in Markdown prose a deltoid is always written in backticks, and
  an item takes the form "`∆foo`: sentence" followed by the needs suffix.
- Not backticked: YAML frontmatter (`id: ∆foo`), filenames, commit subjects, and CLI
  output (`mint` keeps its bare-deltoid stdout contract).
- The starter templates in `src/lib/templates/` follow.
- Existing journal entries are not rewritten, and the migration note says so.
- Before changing the skill prose, find out whether `npx @limulus/delto@1` can resolve to a
  cached 1.x older than the release that contains `∆SwZ`. If it can, pin a minimum version
  in the skill's invocation. Such a CLI would silently see zero items.
- `SKILL.md` describes the current contract only. The bare item form is described in the
  migration reference (`∆uTy`) and nowhere else.
- Migration note: an older project shows bare item prefixes; the migration is mechanical
  (backtick each prefix and add the colon; backtick the ids in needs suffixes).
- Eval by the methodology in `docs/experiments/`: agents given the updated skill write
  new-form items in a sandboxed consumer repo. This is also the first eval of `∆uTy`,
  which could not be tested while the spec and the files agreed: on a project with bare
  items, the agent reports no errors, rewrites nothing unasked, offers to migrate once, and
  `migrate` converts the items.
- Skill prose is `docs(skill):`; the templates ship in the tarball, so they are `feat:`.

## Implementation suggestions

- The `README.md` sections "The backlog" and "The `∆` sigil" show item syntax and need the
  same update.
