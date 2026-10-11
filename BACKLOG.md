# Delto Backlog

This backlog is managed with the [delto](https://github.com/limulus/delto) skill. Consult
it before adding or changing items.

## Refactors

Standing initiative. Keep it first, even when it has no items.

## `/delto add` authoring quality

Small changes to the skill's `references/authoring-backlog-items.md`, each observed
directly in the `∆CTB` eval.

- `∆gmz` Authoring-guide reminder from `mint`
  - `mint` prints one stderr line pointing at the authoring reference, to reach agents that
    mint without having read the skill.
- `∆2hh` Duplicate check covers shipped work
  - The authoring reference warns about work already filed in the backlog; extend it to
    work already shipped in the CLI or code.
- `∆IUb` Subagent backlog read only when needed
  - The authoring reference always requires a subagent to read `BACKLOG.md`; limit that to
    large backlogs or a full context window.

## Lifecycle gaps

Behavior the `/delto` skill or tools assume but nothing documents, found in a 2026-07-01
gap review of the backlog.

- `∆VP7` `refine` action in the skill
  - The skill advertises prioritizing and retrospectives but documents no action for
    reworking the backlog, so reworks run unguided.
- `∆Af6` Retire an item without completing it
  - The spec and skill cover only completion, so dropping an item is improvised each time.
- `∆diJ` Claim visibility and stale-claim recovery
  - Agents do not know that `surface --json` lists claims, and a crashed agent's claim
    hides its item indefinitely.

## Someday/Maybe

Work the delto spec does not call for. Parked until a spec revision or a concrete user need
brings it back.

- `∆dlO` Spike: deep backlog-quality review
  - A multi-agent workflow that checks each item against the repo, to catch what `lint`
    cannot: stale premises, work already done, semantic duplicates.
- `∆Stb` `delto status` progress report
  - A read-only report of per-initiative remaining work, eligible tasks, and critical path.
    Last shipped as the legacy `backlog-status`/`report-status.ts`, now in Git history.
- `∆Pli` Claude Code plugin distribution
  - Install the `/delto` skill and the `delto` binary together from a plugin marketplace,
    not as separate `npx skills add` and `npx @limulus/delto@1` steps.
- `∆oJF` GUI for the backlog and journal
  - Show the `needs:` graph, what is eligible, and completed-item history in a browser.
    Prior art is in the unmerged `mockups/*` branches.
- `∆rTJ` Spike: unique deltoids across a monorepo
  - Decide whether deltoids are unique repo-wide or per backlog. Today `mint` can miss
    in-flight ids in a sibling backlog and collide.
- `∆NOp` Spike: parallel-work collision detection
  - Reconsider the removed `touches:` edge: what predicts a merge collision, and whether it
    earns the bookkeeping.
