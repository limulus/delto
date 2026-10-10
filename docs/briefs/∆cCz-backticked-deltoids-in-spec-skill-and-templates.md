---
id: ∆cCz
serves:
  - readable-backlog
---

# Backticked deltoids in the parser, spec, skill, and starter templates

## Value

Someone reading a backlog or a journal entry can pick out item ids at a glance, and does not
mistake one id for another. A project that writes its items this way finds that every delto
command still sees them.

## Background

Backticks put a deltoid in a monospace font, which tells `I`, `l`, and `1` apart, and they
make the id stand out in a line of prose.

`parseBacklog` matches only a bare, unbackticked item prefix today, so every subcommand
treats a backticked item as no item at all. The skill cannot tell agents to write a form
that the CLI does not read, so the parser change and the skill change are one piece of work,
done in that order. delto's own `BACKLOG.md` already writes its items in the backticked
form, so the CLI sees none of them until the parser change lands.

## Serves

- `readable-backlog`: ids are easy to spot and hard to misread.

## Scope and constraints

- `parseBacklog` recognizes "- `∆foo` text" as well as "- ∆foo text". Both forms may
  appear in one file.
- Backticked ids in the needs suffix already parse; add a test that keeps it so.
- `complete` transcribes the item verbatim; confirm it does for the new form.
- The parser change is additive: both forms stay valid, so no project has to change and the
  CLI stays on major version 1.
- The warning in `src/lib/templates/backlog.ts`, that template text must never start a line
  like an item, now covers both forms.
- The parser change is in a published release before the skill prose reaches Git HEAD. An
  adopter's skill comes from Git HEAD, and a CLI without the parser change sees zero items
  in a backticked backlog and reports nothing wrong.
- No minimum version is pinned in the skill's invocation (decided 2026-10-10). On npm
  11.16, npx re-checks the registry for a range like `@1`, so a cached older 1.x is not
  reused. A copy installed in a project's own `node_modules` is still used as it is.
- Spec text in `SKILL.md`: in Markdown prose a deltoid is always written in backticks, and
  an item takes the form "`∆foo` sentence" followed by the needs suffix.
- Not backticked: YAML frontmatter (`id: ∆foo`), filenames, commit subjects, and CLI
  output (`mint` keeps its bare-deltoid stdout contract).
- The starter templates in `src/lib/templates/` follow.
- Existing journal entries are not rewritten, and the migration note says so.
- `SKILL.md` describes the current contract only. The bare item form is described in the
  migration reference (`∆uTy`) and nowhere else.
- Migration note: an older project shows bare item prefixes; the migration is mechanical
  (backtick each prefix and the ids in needs suffixes).
- No multi-agent eval (decided 2026-10-10): the maintainer evaluates the change by using it
  on real projects. The `migrate` action (`∆uTy`) gets its first test the same way.
- Skill prose is `docs(skill):`; the parser and the templates ship in the tarball, so they
  are `feat:`.

## Implementation suggestions

- Extend the `itemStart` pattern in `parseBacklog` and keep the shared `ID` constant.
- `lint` could later warn about a file that mixes the two forms.
- The `README.md` sections "The backlog" and "The `∆` sigil" show item syntax and need the
  same update.
