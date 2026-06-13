---
id: ∆Bpr
completed: 2026-06-13 11:55:12 -07:00
---

## Backlog item

> - ∆Bpr Enable GitHub branch protection on `main` — require PR + passing CI before merge
>   so an accidental push (e.g. an agent in YOLO mode) cannot trigger an unreviewed publish.
>   GitHub rejects branch protection on free private repos; the repo is now public (∆29K), so
>   this is unblocked.

## Planning

Used a modern repo **ruleset** (not classic branch protection) on `~DEFAULT_BRANCH`. Tuned
for a solo maintainer: **0 required approvals** (requiring 1 deadlocks self-authored PRs,
since you can't approve your own), **no bypass actors** (so the rule applies to admins too —
a YOLO-mode agent acting as the owner still can't push to `main` or trigger an unreviewed
publish, which is the whole point), plus force-push and deletion blocked. Required status
check pinned to a *stable* context name with `integration_id` locked to GitHub Actions.
Only `main` is protected — maintenance/prerelease branches stay open so semantic-release can
still publish from them.

## Refinement

Two course-corrections, both caught by the user:

- **Over-engineered the stable check first.** Added a `ci` aggregator job — a whole runner
  just to shell `[ "${{ needs.verify.result }}" = "success" ]` — to decouple the required
  check from the matrix's version-baked name (`verify using node v22`). For a single-version
  build that's overkill: the fix is to drop the one-entry matrix and name the job `verify`.
  The aggregator only earns its runner once there's a real multi-version matrix to umbrella.
- **Broke semantic-release's branch model.** Restricting `on: push` to `[main]` and gating
  `publish` to push events would stop a `1.x` maintenance branch (or `next`/`beta`) from ever
  triggering the workflow, so semantic-release could never publish from it. The release-branch
  gate belongs in semantic-release's `branches` config, not the workflow trigger — it
  self-selects and no-ops elsewhere. Reverted to all-branch `on: push`. A push-triggered check
  attaches to the head SHA and satisfies required checks on a PR, so `pull_request` wasn't
  even needed. Net change to land protection: a one-job rename.

Sequencing detail: pointed the ruleset's required check at `verify` *before* merging the
rename PR (the old `verify using node v22` would never report again). The REST API accepts a
not-yet-seen context string; the web UI does not. Bumping the runner is now safe for [[∆uFs]]
— the required-check name no longer carries the Node version.

## Retrospective

Couldn't get a clean live rejection test. `git push --dry-run` reports success without ever
exercising the ruleset (server-side enforcement happens at the ref-update it skips), and a
real direct push to `main` is blocked by Claude Code's own auto-mode guard — a useful second
layer, but it means GitHub's rule went unproven by a direct attempt. Confirmed instead by the
ruleset config plus the rename actually flowing through the PR path (PR #2). Lesson: a
dry-run push is not proof a ruleset works. The sharper lesson: I twice bolted on scope the
task didn't need, and one addition actively broke the release flow — the minimal correct
change was a single job rename. Unblocked by [[∆29K]] going public; protects the publish path
from [[∆fb2]].
