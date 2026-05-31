---
id: ∆RP9
completed: 2026-05-31 05:30:05 +00:00
---

## Backlog item

> - ∆RP9 Act on the feat/cli-primitives self-review — remove the undocumented `touches:`
>   collision mechanism from the CLI, switch journal timestamps to `date-fns`, read journal
>   files concurrently in `takenIds`, gate the surface `→N` legend, dedupe `needs:`, and make
>   the mint taken-id test deterministic.

## Planning

Backfilled: this work came out of a difit self-review of the `feat/cli-primitives` branch
(the four new CLI subcommands), not an up-front plan. The substantive calls:

- **Remove `touches:`.** It was an undocumented same-file collision heuristic, absent from
  the v1.0 `SKILL.md` spec, so eligibility is now simply *claimed* + open *needs:*.
- **`date-fns` for completion timestamps.** Reverses an earlier dep-free formatter, per the
  standing preference for well-tested libraries over hand-rolled code.
- **Async `takenIds`.** A long-lived repo's journal can hold 1000+ entries, so the files are
  read concurrently rather than one at a time.

Two deeper questions became spikes: `∆rTJ` (repo-wide unique deltoids across multiple
`BACKLOG.md`s in a monorepo) and `∆NOp` (whether parallel-work collision detection is worth
reviving in some form).

## Refinement

Scope shifted mid-review. The skills-side `touches` removal (briefly tracked as `∆HSi`) was
dropped: the per-skill `skills/<name>/` dirs are legacy, slated for deletion by `∆Rnm` (now
unblocked — its four `needs:` are journaled), and the surviving consolidated
`skills/delto/SKILL.md` never referenced `touches`. The other review nits were deferred
rather than bundled here: `∆y0B` (move `io.ts` to `src/lib` + relocate the DI types +
`RouterOptions` split), `∆hoW` (`parseDeltoid`/`resolveRepoRoot` DRY helpers + small fixes),
and `∆HQN` (document the complete-before-prune ordering). The `date-fns` offset tests are
deterministic via IANA zones (`America/Phoenix`, `Asia/Kolkata`) plus fixed UTC instants,
replacing the old injected-`offsetMinutes` seam.

## Retrospective

Reviewing the whole branch diff in one pass was hard on attention; dogfooding the CLI in a
scratch repo plus a findings-first skim worked far better than a linear read — worth
defaulting to for large diffs. Separately, difit 5.0.1's startup `--comment` seeding is
broken (the client never wires it up, and the localStorage bootstrap can clobber the server
session); the reliable path is `--clean` plus injecting through the live `comment add`
endpoint.
