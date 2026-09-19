---
id: ∆cCz
serves:
  - readable-backlog
written: 2026-09-19
commit: 2633dad
---

# Backticked deltoids in the spec, skill, and starter templates

## Value

People reading rendered Markdown. Backticks put a deltoid in a monospace font, which tells
`I`, `l`, and `1` apart, and they make the id stand out in a line of prose.

## Serves

- `readable-backlog`: ids are easy to spot and hard to misread.

## Scope and constraints

- Spec text in `SKILL.md`: in Markdown prose a deltoid is always written in backticks, and
  an item takes the form "`∆foo`: sentence" followed by the needs suffix.
- Not backticked: YAML frontmatter (`id: ∆foo`), filenames, `[[∆foo]]` cross-reference
  links, commit subjects, and CLI output (`mint` keeps its bare-deltoid stdout contract).
- The starter templates in `src/lib/templates/` follow.
- Existing journal entries are not rewritten, and the adopter log entry says so.
- Before changing the skill prose, find out whether `npx @limulus/delto@1` can resolve to a
  cached 1.x older than the release that contains `∆SwZ`. If it can, pin a minimum version
  in the skill's invocation. Such a CLI would silently see zero items.
- `SKILL.md` describes the current contract only. The bare item form is described in the
  adopter log (`∆uTy`) and nowhere else.
- Adopter log entry: recognized by the bare item prefix; the migration is mechanical
  (backtick each prefix and add the colon; backtick the ids in needs suffixes).
- Eval by the methodology in `docs/experiments/`: agents given the updated skill write
  new-form items in a sandboxed consumer repo.
- Skill prose is `docs(skill):`; the templates ship in the tarball, so they are `feat:`.

## Implementation suggestions

- The `README.md` sections "The backlog" and "The `∆` sigil" show item syntax and need the
  same update.
