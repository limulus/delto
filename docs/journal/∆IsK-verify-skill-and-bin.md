---
id: ∆IsK
completed: 2026-05-31 07:00:03 +00:00
---

## Backlog item

> - ∆IsK Verify `npx skills add` reaches the consolidated `/delto` skill from the Git
>   ref — directory layout and `SKILL.md` frontmatter resolve, and `npx @limulus/delto@1
>   <sub>` runs the published bin end-to-end on a fresh consumer checkout; needs: ∆Rnm

## Planning

Two acceptance criteria here can't run before the package is actually published and the branch
pushed: `npx @limulus/delto@1 <sub>` needs the package live on GitHub Packages, and `npx skills
add <git-ref>` needs a pushed ref. (Both are blocked on ∆Sre + repo secrets, which are out of
scope tonight.) So I scoped the verification to everything provable against the local artifact
and a local skill source, and treated the two network/publish-dependent confirmations as a
tracked residual rather than a blocker.

## Refinement

Local verification (run read-only, no tracked files touched):

- **Built bin, end-to-end.** `npm run build` then `node dist/esm/bin/cli.js …` for `--help`,
  `mint`, `surface`, `complete --help` all exit 0 with correct output and no
  `ERR_MODULE_NOT_FOUND` — confirming `rewriteRelativeImportExtensions` produced working `.js`
  imports in the shipped JS.
- **Fresh-consumer install.** `npm pack` → a clean `/tmp` project → `npm install <tgz>` pulled
  the four runtime deps from public npm and linked the `delto` bin; the installed bin ran
  `--help` and `mint`. This exercises the real packaged artifact, just not registry/tag
  resolution.
- **Skill discovery.** `skills/delto/` is a single `SKILL.md` with conformant frontmatter
  (`name: delto`, non-empty `description`, `metadata.version: '1.0.0'`). The real `skills` CLI
  (skills.sh, v1.5.9) accepts a local source: `skills add /workspaces/delto --skill delto`
  installed a byte-identical `SKILL.md` into a temp consumer's `.claude/skills/delto/`.

The verification surfaced two genuine publish blockers, filed as [[∆kl2]]: the build compiles
`src/**` — tests and `src/mocks/` included — and `files: ["dist","src"]` ships them, so the
tarball carried 142 files of mostly test code; and three package.json URLs
(`repository.url`, `bugs.url`, `homepage`) each duplicate the `@limulus/` scope into a broken
path. The remaining live-registry / pushed-ref confirmations are filed as [[∆LwK]] (needs
∆Sre). Completing ∆IsK also empties and retires the `### Skill Packaging` epic (its other
item, ∆Rnm, shipped earlier today).

## Retrospective

Pushing the verification all the way to a real `npm pack` + install — rather than stopping at
"the tests pass" — is exactly what caught the tarball leak, which a green test suite says
nothing about. The split between "verifiable now" and "needs a live publish" is real and worth
keeping honest: marking ∆IsK done while explicitly carrying [[∆LwK]] as the post-publish half
is more truthful than either pretending it's fully done or blocking on something I can't do
tonight.
