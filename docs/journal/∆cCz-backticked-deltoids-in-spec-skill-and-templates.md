---
id: ∆cCz
completed: 2026-10-10 10:39:57 -07:00
---

## Backlog item

> - `∆cCz` Deltoids are easy to spot and hard to misread, because the spec, skill, and starter
>   templates write them in backticks and the parser reads items written that way

## Value

Someone reading a backlog or a journal entry can pick out item ids at a glance, and does not
mistake one id for another. A project that writes its items this way finds that every delto
command still sees them. Serves `readable-backlog`: backticks put a deltoid in a monospace
font, which tells `I`, `l`, and `1` apart, and make it stand out in a line of prose.

## Planning

The work began as two items: `∆SwZ` (the parser reads the backticked form) and `∆cCz` (the
skill and templates write it). They were folded into one on 2026-10-10, because the skill
cannot teach a form the CLI does not read. Decisions made on the way:

- **No colon.** The briefs specified "`∆foo`: sentence". The maintainer tried it on delto's
  own backlog and preferred `` `∆foo` sentence ``; older items that open with a label read
  badly with two colons ("`∆NOp`: Spike: …").
- **Spec wording** is the maintainer's: a deltoid "MUST be rendered as monospace in HTML and
  Markdown", and MUST be left bare in YAML frontmatter, filenames, and commit subjects.
- **No multi-agent eval.** The skill's only real user is the maintainer, who evaluates a
  change by using it. The eval rule left `CLAUDE.md` in the same change, and the `migrate`
  action (`∆uTy`) is still untested.
- **No minimum CLI version** in the skill's `npx @limulus/delto@1` line. In npm 11.16,
  `libnpmexec` re-checks the registry for a range in the npx cache, so a cached older 1.x
  is not reused. A copy in a project's own `node_modules` that satisfies `@1` is still
  used as it is; that case was judged not worth a pin.

`parseBacklog` holds the only item-line pattern. `complete`, `lint`, and `surface` go
through it; `claim` and `release` never read items, and `mint` scans for any `∆xxx`. So
the parser change was one pattern, with a backreference so that an unbalanced backtick
does not start an item. Both forms may appear in one file and name the same item.

## Refinement

- **`[[∆xxx]]` links were dropped**, which was not planned. Nothing that renders these
  files resolves that syntax, so the links only ever showed as brackets. The convention
  left the journal README and its template, and the links in twenty journal entries and
  three experiment write-ups became backticked deltoids so the form does not spread.
- **Unchanged on purpose:** CLI output stays bare, including `mint`'s stdout, and
  `journalIds` still reads only a bare `id: ∆xxx` in frontmatter.
- **The first migration note** went into `references/migrating-older-projects.md`. It has
  the agent compare `lint`'s item count before and after, because a CLI too old to read
  backticked items reports fewer items and nothing else.
- **The groundwork items** `∆NLi`, `∆YQb`, `∆Wak`, and the self-migration item `∆8n4` were
  removed from the backlog in the same change, with the needs edges that pointed at them.
  Their briefs still exist, and `docs/briefs/README.md` still cites `∆YQb` and `∆8n4`.
- **Order of release:** the skill reaches adopters from Git HEAD, so the parser has to be
  in a published release before the skill prose is pushed. At completion the commits were
  local, ordered so the parser and templates can be pushed first.
- **Not done here:** migrating lemmon and menschen, and refreshing the globally installed
  skill copy, which dated from August and lacked `lint` and `migrate`.

## Retrospective

delto's own backlog was backticked before the parser could read it, and for that stretch
`surface` reported 0 of 0 items and `lint` reported "clean: all 4 checks pass (0 items)".
A backlog the CLI cannot read looks exactly like an empty, healthy one. That is the hazard
the migration note's item count guards against, and it is worth remembering whenever the
item form changes again.

Two mistakes in the session were about commits. The agent committed once the plan was
approved, though the plan's commit list was a description and the maintainer had not asked
for commits; they were undone. And the first of those commits swept in seven files the
maintainer had already staged, because the index was not checked first. Before any commit,
look at `git diff --cached --name-only`, and wait to be asked.
