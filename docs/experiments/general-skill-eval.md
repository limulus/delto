# Where is the `/delto` skill weak across its whole surface?

**Date:** 2026-06-16 · **Verdict: solid across all actions.** Duplicate/already-done
detection is the standout strength; the ∆GJ3 "perform-instead-of-file" trap did not
reproduce in the one clean test. Three follow-ups filed (∆GJ3 reframed, ∆2hh, ∆IUb).

## Question

[[∆Xtj]] A/B-tested only the authoring reference. Does the rest of the skill — the
`add`/`plan`/`complete` actions, spec recall, and the open ∆GJ3 routing concern — behave
correctly against the spec, and where are the weak spots worth filing?

## Design

- **Substrate:** this repo, copied into isolated sandboxes (rsync sans `.git`/`node_modules`,
  the latter symlinked; each its own `git init`) so no agent could touch the real backlog,
  journal, or git. Runs minted/claimed/completed via the local `node ./src/bin/cli.ts`.
- **Runs:** 6 scenario types + 2 novelty-verified follow-ups + 1 no-skill baseline = 9.
  Each with-skill agent was pointed at `skills/delto/SKILL.md` and told to follow it.
- **Grading:** outcomes verified against each sandbox's git state, not just the agents'
  self-reports — which caught that `plan`'s claim landed in the gitignored
  `.delto-claims.local.jsonl` and that `complete` committed cleanly.

## Results

| Test | Prompt | Result | Verdict |
|------|--------|--------|---------|
| add-imperative-trap (skill) | `/delto add Add a delto lint command that checks for duplicate IDs` | Caught ∆PZ3 dup, filed nothing, did NOT implement | ✅ correct (dup) |
| add-imperative-trap (baseline, no skill) | same | Also caught ∆PZ3 dup, no change | repo context alone enough here |
| add-indirect-trigger | "jot down monorepo dual-BACKLOG uniqueness" | Caught ∆rTJ dup, triggered skill, no change | ✅ correct (dup) |
| add-duplicate-trap | `/delto add ... backlog linter ...` | Refined existing ∆PZ3 in place (added a *why*), stayed ≤5 lines | ✅ correct (refine) |
| plan-no-item | `/delto plan` | surfaced top-priority ∆GJ3 → claimed it → planned, no code | ✅ correct |
| complete-ordering | "I'm happy with ∆GJ3, wrap up & commit" | `complete` ran while item present → journal filled → item removed → `docs(journal):` commit | ✅ textbook |
| loose-deltoid-ref | "what's the deal with delta GJ3?" | resolved → ∆GJ3 via case-insensitive grep, accurate answer | ✅ correct |
| add-novel-imperative (json) | `/delto add Add a --json flag to surface` | Minted, then found --json already SHIPPED (checked `surface --help`), discarded, no change | ✅ correct (already shipped) |
| add-novel-imperative (completion) | `/delto add Add bash and zsh shell completion` | FILED item with good why, placed in Someday/Maybe, did NOT implement | ✅ **clean ∆GJ3 pass** |

## Findings

1. **∆GJ3 (perform-instead-of-file) did not reproduce** in the one clean test. Weak but
   encouraging evidence the failure may be largely mitigated by ∆WyS + the backlog-header
   framing. Only one clean shot, though — the other add prompts short-circuited on
   duplicates/already-shipped before the trap could fire. → reframed ∆GJ3 to *measure first*.
2. **Duplicate / already-done detection is the standout strength** — 4 of 5 add prompts
   correctly caught existing coverage (∆PZ3 ×2, ∆rTJ, shipped `--json`). No false positives.
3. **Already-SHIPPED detection (not just already-filed)** — one agent verified against
   `surface --help`, catching code reality the backlog text wouldn't show. The reference only
   mentions backlog duplicates today. → filed [[∆2hh]].
4. **Inconsistent subagent dispatch for the dup scan** — the reference mandates "Dispatch a
   subagent"; 2 of 5 runs did, 3 read inline. Inline was cheaper and correct at this size.
   → filed [[∆IUb]].
5. **`plan` / `complete` / loose-ref are solid** — no changes warranted.

## Honest limits

A delto repo is saturated with delto context (`CLAUDE.md`, `BACKLOG.md`), so the no-skill
baseline behaved almost identically to the with-skill run on the one case it was used — the
skill's real lift would show more starkly in a bare consumer repo. Picking eval prompts
without checking novelty first wasted four of six `add` scenarios on already-covered work;
verify novelty up front next time (now baked into ∆GJ3's method). That the backlog kept
absorbing "new" ideas as duplicates is itself a quiet endorsement of its hygiene.
