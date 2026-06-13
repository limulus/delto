---
id: ∆fb2
completed: 2026-06-13 10:58:47 -07:00
---

## Backlog item

> - ∆fb2 Publish to the public npm registry, not GitHub Packages — drop the
>   `publishConfig.registry` (`npm.pkg.github.com`) override and update the `cd.yaml` publish
>   job's registry + auth token so `npx @limulus/delto@1` resolves from public npm. Surfaced by
>   the ∆Rdm review.

## Planning

Considered OIDC trusted publishing but **deferred it to [[∆uFs]]** — it forces a
`semantic-release` major bump (OIDC landed in `@semantic-release/npm` 13.1; we're on 12) and
a Node 24 runner, too much to staple onto the first release. Shipped 1.0.0 with a
package-scoped `NPM_TOKEN` instead, which also sidesteps trusted publishing's bootstrap
problem: the first CI run *creates* the package, no manual seed needed.

The `cd.yaml` work: point the publish job at public npm (`NPM_TOKEN`) and drop the
GitHub Packages registry, drop the now-dead `GPR_READ_TOKEN` on `npm ci`, and add
`publishConfig.access: "public"` so the scoped package publishes publicly.

## Refinement

- **The real blocker was workflow permissions, not auth.** The repo's default workflow token
  was read-only, so semantic-release's GitHub plugin would have aborted at `verifyConditions`
  before publishing anything. Granting the publish job `contents/issues/pull-requests: write`
  fixed it. Invisible from the repo text — only `gh api .../actions/permissions/workflow`
  surfaced it (same external-state lesson as [[∆hXH]]).
- **Phantom "command not found" on first smoke.** Right after publish, `npx @limulus/delto@1`
  reported `sh: delto: command not found`. The package was fine — a clean `npm i` and a
  cache-cleared `npx` both resolved 1.0.0 and ran the bin. It was a stale npx cache, not a
  packaging fault. Don't chase the tarball when the registry metadata is fresh.

## Retrospective

Probing live external state during pre-flight is what saved the release — the read-only token
default would have failed the first publish silently-ish, and it was invisible until queried
directly. The token route was the right call for speed; OIDC hardening is tracked as
[[∆uFs]]. The live-registry half of [[∆LwK]] is now confirmed; its `npx skills add <git-ref>`
half remains.
