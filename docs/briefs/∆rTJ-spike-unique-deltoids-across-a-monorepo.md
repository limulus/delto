# Spike: unique deltoids across a monorepo

## Background

The item's original text, moved here unchanged on 2026-10-11 when backlog items were cut to
a title and two lines:

Spike: repo-wide unique deltoids across multiple `BACKLOG.md`s in a monorepo.
Decide whether deltoids are unique repo-wide (discover every `BACKLOG.md` + its journal
dir — default `docs/journal/` relative to each, overridable via YAML frontmatter) or
only per-backlog. Today `mint` scans the nearest backlog but resolves `--journal-dir`
against the cwd, so it can miss in-flight ids and collide
