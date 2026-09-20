---
id: ∆8n4
serves:
  - cheap-adoption
written: 2026-09-19
commit: 2633dad
---

# Migrate delto's own backlog

## Value

A project that follows delto's migration guide is following steps that have already worked
on a real project. delto's maintainer also gets delto's own backlog in the new form.

## Background

delto's own backlog is the first project the guide is used on.

## Serves

- `cheap-adoption`: mistakes in the guide are found here, not in an adopter's project.

## Scope and constraints

- Follow the `migrate` action (`∆uTy`) as an adopter would, not from memory of having built
  it. Record every place where the guide was wrong or unclear, and fix the guide.
- Expected steps: add the frontmatter; backtick the item prefixes; shorten every live item
  to one sentence with a proposal; have the maintainer confirm the outcomes in
  `docs/outcomes.md`; bring this directory's provisional files in line with the final shape.
- Old journal entries are not rewritten.

## Implementation suggestions

- Run it with a fresh agent that has not seen this initiative's history, so that gaps in
  the guide show up.
