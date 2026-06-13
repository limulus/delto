---
id: ∆29K
completed: 2026-06-13 10:38:33 -07:00
---

## Backlog item

> - ∆29K Go public before the first publish — the single owner of making the project public:
>   choose and add a LICENSE (currently `UNLICENSED`) and flip the GitHub repo from private to
>   public. Surfaced by the ∆Rdm review.

## Planning

No separate plan — the item's text was the checklist: pick a license, add it, make the
package metadata agree, and flip the GitHub repo public. Chose **MIT** as the permissive
default fitting a distributable open tool: a `LICENSE` file (`MIT`, 2026 Eric McCarthy) plus
`package.json` `license` `UNLICENSED` → `MIT`. The repo was flipped to public out of band;
`gh repo view` confirmed `visibility: PUBLIC` at completion.

## Refinement

- **Lockfile drift caught.** Changing `package.json`'s `license` left `package-lock.json`'s
  root entry at `UNLICENSED`; `npm install` regenerated it so the published tree doesn't
  carry a contradictory license claim. A license isn't "added" until every place that
  declares it agrees.
- **Scope split recorded.** The same working tree also dropped the `publishConfig.registry`
  GitHub Packages override, but that's [[∆fb2]]'s public-npm work, not ∆29K's — noted so the
  two items stay cleanly separated in history.

## Retrospective

The "going public" half was a one-click GitHub toggle; the easy-to-miss half was metadata
agreeing across files — `package.json` and the lockfile both had to move, not just the
visible `LICENSE`. Completing this unblocked [[∆Bpr]] (branch protection requires a public
repo on the free tier) and clears the licensing precondition for the first publish ([[∆fb2]]).
