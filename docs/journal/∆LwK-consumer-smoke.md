---
id: ∆LwK
completed: 2026-06-14 22:38:53 -07:00
---

## Backlog item

> - ∆LwK Post-publish consumer smoke — confirm `npx skills add <git-ref>` installs
>   `skills/delto` from the pushed ref. The live-registry half (`npx @limulus/delto@1` resolving
>   the `@1` tag from public npm) is confirmed in ∆fb2's journal, and ∆IsK/∆Sre covered the
>   local skill-add and tarball halves; the pushed-ref half is what's left.

## Planning

Verification-only — no code change. The other halves of consumer install were already
covered: the live npm registry tag (`npx @limulus/delto@1`) in [[∆fb2]], and the local
skill-add and tarball paths in [[∆IsK]]/[[∆Sre]]. All that remained was the pushed-ref
path: does `npx skills add <github-ref>` clone the public repo and install `skills/delto`
from it.

## Refinement

Smoke run in a throwaway `/tmp` directory (and independently by the user on the host):

- `npx skills add limulus/delto --list` resolved the shorthand to
  `https://github.com/limulus/delto.git`, cloned it, and reported `Found 1 skill` →
  `delto` with the correct description. So the pushed ref carries the skill.
- `npx skills add limulus/delto --all` installed it; `diff -rq` of the installed tree
  against the repo's `skills/delto` was byte-identical (SKILL.md + references/).

One thing worth recording for future consumers: the `skills` CLI's default install
location is `.agents/skills/<name>`, not `.claude/skills/`. This project's own
`.claude/skills/delto` is a dogfooding symlink to `../../skills/delto` and is unrelated to
a real consumer install — don't mistake its presence for proof the smoke passed.

## Retrospective

Testing in a clean directory was the right call: the project's dogfooding symlink would
have masked whether the pushed ref actually delivered the skill. The `--list` step is the
cheapest possible confirmation (resolves + clones without installing), and the `diff -rq`
turned "looks installed" into "provably identical to source." Nothing deferred.
