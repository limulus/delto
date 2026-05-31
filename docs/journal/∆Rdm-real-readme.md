---
id: ∆Rdm
completed: 2026-05-31 07:08:13 +00:00
---

## Backlog item

> - ∆Rdm Real README + getting-started — replace the placeholders with what delto is, the
>   install path (`npx skills add` for the `/delto` skill, `npx @limulus/delto@1` for the
>   tool), and the backlog lifecycle linked to each subcommand's `--help`; needs: ∆IsK

## Planning

The placeholder README was the default library template — `npm install` then
`import Class from '@limulus/delto'` — which is wrong twice over: delto is a CLI + skill, not
a library (no `main`/`exports`, bin-only per ADR-001). The rewrite had to convey three things
the item called out: what delto is, the two install paths, and the lifecycle tied to each
subcommand's `--help`. I leaned on what ∆IsK had just verified for the install commands so the
README documents paths that actually resolve, not aspirational ones.

## Refinement

Two accuracy calls worth noting. The skill install is `npx skills add limulus/delto` (Git-
driven, per ADR-001) — ∆IsK confirmed the `skills` CLI resolves `skills/delto` from a source,
though the remote-ref form specifically is still pending a push ([[∆LwK]]). The tool line is
`npx @limulus/delto@1 <subcommand>`, and because the package targets GitHub Packages
(`publishConfig.registry`), I documented the one-line `@limulus:registry=...` `.npmrc` a
consumer needs — otherwise the command 404s, which a getting-started must not gloss over. Each
of the five subcommands links to its own `--help` as the source of truth for flags, keeping the
README a map rather than a duplicate of the per-command contracts.

## Retrospective

Doing this after ∆IsK and ∆kl2 rather than before was the right order: the README now states
install paths that were actually exercised and a package that's actually clean, instead of
documenting the broken-URL, test-leaking state. The one soft spot is the exact
`npx skills add` remote syntax, which can't be fully nailed down until the repo is pushed and
[[∆LwK]] runs it for real.
