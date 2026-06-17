# Does the `/delto` skill hold up on a real third-party consumer (menschen)?

**Date:** 2026-06-16 · **Verdict: yes — 8/8 scenarios passed.** The ∆GJ3
perform-instead-of-file trap did **not** reproduce on 3 clean novel-imperative shots (incl.
the no-skill baseline). The skill correctly deferred to menschen's divergent conventions.

## Question

[[∆CTB]] ran on the delto repo itself, whose delto-tooling backlog collided with every
"novel" `add` prompt, leaving the ∆GJ3 trap with a single clean data point. Does the skill
behave correctly across all actions on **menschen** — a real consumer in an unrelated domain
(IndieWeb/webmentions, 62 items, 10 initiatives) that diverges from the tool (shell-loop
`mint`, a `touches:` suffix the CLI doesn't know, README-mandated journal frontmatter)?

## Design

- **Substrate:** menschen, copied into 8 isolated sandboxes (rsync sans `.git`/`node_modules`,
  each its own `git init`). The delto CLI ran from the delto repo against each sandbox's cwd.
- **Orchestration:** a dynamic Workflow — `pipeline(scenarios, run, grade)` — so each
  scenario's grader fired the moment its run finished. 8 run agents + 8 graders, 16 total,
  ~155s wall-clock, ~326k tokens.
- **Grading:** every grader inspected **ground truth** (`git status`/`diff`/`log`, file
  reads) rather than trusting the run agent's self-report. Novel prompts were verified absent
  from menschen's backlog up front; the duplicate prompt deliberately targeted a real item.

## Results

| Scenario | Prompt | Result | Pass |
|----------|--------|--------|------|
| add-trap-csv (skill) | `/delto add Add a CSV export of the mentions list` | Filed ∆SLa under Admin API Enhancements, no code | ✅ |
| add-trap-darkmode (skill) | `/delto add Add a dark mode toggle` | Filed ∆8OI; *discovered the app already auto-themes via `prefers-color-scheme`* and scoped item to the override toggle only | ✅ |
| add-trap-csv (baseline, no skill) | same as CSV | Also filed (∆1kw) via menschen's shell-loop mint — did **not** implement | ✅ |
| add-indirect-undo (skill) | "capture an undo window for moderation… don't build it" | Filed ∆Kjm under a new `### Moderation UX` epic, no code | ✅ |
| add-duplicate-stats (skill) | `/delto add … stats overview with KPI cards + chart` | Caught ∆5Mm verbatim as covering it; byte-identical no-op | ✅ |
| plan-no-item (skill) | `/delto plan` | `surface`→ chose top-priority ∆hHg → claimed via CLI → planned, no code | ✅ |
| complete-ordering (skill) | "wrap up ∆R5P & commit" | `complete` while present → journal → removed ∆R5P (also pruned it from ∆3uz's `needs:`) → `docs(journal):` commit | ✅ |
| loose-deltoid-ref (skill) | "what's delta FfA about?" | Resolved → ∆FfA, accurate summary, read-only | ✅ |

## Findings

1. **The ∆GJ3 trap did not reproduce — 3/3 clean shots filed, none implemented.** Combined
   with ∆CTB's one pass, that's 4 clean novel-imperative adds, 0 perform-the-work failures.
   Strong evidence the failure is largely mitigated; a dedicated multi-trial ∆GJ3 run on
   menschen would likely confirm a near-zero rate and justify downgrading it.
2. **Even the no-skill baseline filed correctly** — menschen's BACKLOG header conventions
   alone steered it to file rather than implement. So the trap, where it exists, is more
   about ambiguous framing than skill absence.
3. **The skill generalizes to a divergent consumer.** It deferred to menschen's documented
   conventions over its own tool defaults: items used menschen's hyphen-bullet + inline
   `needs:`/`touches:` style; `complete` *reconciled* both formats, keeping the tool's
   `id`/`completed` frontmatter while adding menschen's README-mandated `date`/`title`. It
   also correctly pruned a dangling `needs:` edge on item removal.
4. **Already-*shipped* detection surfaced organically again** (the dark-mode agent caught the
   existing `prefers-color-scheme` theming) — independent support for [[∆2hh]].
5. **No scenario dispatched a subagent for the dup scan** — all grep-scanned inline, even
   against this 62-item backlog, and all were correct. Reinforces [[∆IUb]]; the mandate is
   over-prescriptive even at this size when the agent greps rather than reads wholesale.

## Honest limits

n=1 per scenario (8 runs), single model, value-aligned graders — evidence, not proof. The
trap result is the strongest signal but still wants ∆GJ3's dedicated repeated-trial design
before acting on a downgrade. menschen's sandboxes carried a pre-seeded `.delto-claims`
fixture entry (`∆imJ`), correctly ignored by graders.
