---
id: ∆uFs
completed: 2026-06-14 21:49:29 -07:00
---

## Backlog item

> - ∆uFs Switch publishing to OIDC trusted publishing — retire the `NPM_TOKEN` secret and its
>   rotation chore for tokenless publishes with provenance. More than a config toggle: it needs a
>   `semantic-release` major bump (OIDC support landed in a newer `@semantic-release/npm`) plus a
>   trusted publisher registered on npmjs.com.

## Planning

[[∆fb2]] scoped this as a `semantic-release` major bump **plus a Node 24 runner**. Only the
first half held. The bump (`semantic-release` 24 → 25, pulling `@semantic-release/npm` 13.1.5)
was already in the working tree, and 13.1.5's engines are `^22.14.0 || >=24.10.0` — so the
existing `node-version: 22` runner (resolving to ≥22.14) clears the bar with no runner bump and
no churn to the stable `verify` check name ([[∆Bpr]]). That left the change small: in `cd.yaml`'s
publish job, grant `id-token: write` and drop `NPM_TOKEN` from the `semantic-release` env.

The mechanism, confirmed by reading the installed plugin rather than guessing: on the official
registry `@semantic-release/npm` mints a GitHub OIDC token (`@actions/core` `getIDToken`, which
needs `id-token: write`), exchanges it with npm for a short-lived credential, and bypasses
`.npmrc`/`NPM_TOKEN` entirely — provenance attaches server-side. OIDC engages only because the
package targets official npm (`publishConfig.access: public`, no registry override, no `.npmrc`).

## Refinement

- **No GitHub Actions `environment` on the job.** The trusted publisher was registered on
  npmjs.com without an environment, so the job deliberately has no `environment:` key — the two
  must match or the token exchange is rejected.
- **`concurrently` 9 → 10 rode along.** That bump is unrelated to OIDC — it landed from a
  parallel session's `npm audit` fix and is in this commit only because it shares
  `package-lock.json`. Noted here so the diff doesn't read as part of the publishing change.
- **The comment got whittled down.** A first pass over-explained the one permission line; it
  settled at a terse `# OIDC trusted publishing` once the permission spoke for itself.

## Retrospective

The win was disproving the deferred-scope assumption by reading the dependency's `engines` and
token-exchange code instead of trusting [[∆fb2]]'s note — the Node 24 runner it warned about was
already obsolete by 13.1.5, which collapsed the task to two lines. Real acceptance still needs a
versioning commit to trigger a live publish from `main`; until then the `NPM_TOKEN` secret stays
put as a fallback and should be deleted manually once a provenance-bearing publish is confirmed.
