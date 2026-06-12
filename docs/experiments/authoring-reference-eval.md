# Does `authoring-backlog-items.md` improve agents' backlog items?

**Date:** 2026-06-12 · **Verdict: yes — both models improved, Opus most.** One regression
(Opus item length) noted below.

## Question

`skills/delto/references/authoring-backlog-items.md` landed in bdf1c03. Does giving an
agent that reference, on top of the base delto skill, produce measurably better backlog
items than the base skill alone?

## Design

- **Substrate:** the menschen repo's real `BACKLOG.md` (own conventions: initiative→epic
  hierarchy, 5-line item max, `needs:`/`touches:` suffixes) plus its 25 completed journal
  entries, copied into 32 isolated sandboxes.
- **Cells:** 2 models (Opus 4.8, Sonnet 4.6) × 2 conditions. *Treatment* = full SKILL.md
  with the reference inlined. *Control* = SKILL.md with the reference link replaced by the
  reference's length guidance verbatim ("respect the backlog's own line limit; 2–3 lines is
  a good default") — so **length guidance was held constant** and the measured difference
  is the rest of the reference. Note bdf1c03 added both the reference *and* SKILL.md's
  `### add` section; both conditions used the current SKILL.md, isolating the reference doc.
- **Effort:** pinned to high for all generation agents and judges (session-level, inherited).
- **Prompts:** 8 scenarios synthesized by a Fable 5 agent from the menschen corpus, one
  each of: terse, context-rich, vague/missing-data, multi-item, near-duplicate (should
  refine ∆kkN, not duplicate), has-prerequisites (should earn `needs: ∆BIP, ∆ZRw`), re-add
  (substance from the ∆lRb journal entry), placement-ambiguous. Each scenario recorded
  designer notes on deliberately included/omitted context plus a good-outcome sketch.
- **Generation:** 8 × 4 = 32 agents, each in its own sandbox, minting via the local CLI
  (`node ./src/bin/cli.ts mint --journal-dir …`), returning the item text and a unified diff.
- **Judging:** per scenario, 2 independent Fable 5 judges scored the 4 attempts blind
  (anonymized A–D in a pre-shuffled order, no model/condition labels) 1–5 on:
  self-containment, why, placement, `needs:` honesty, duplicate handling, format, line
  limit — plus a forced ranking. 16 judges, 64 scored outputs, no dropped agents.

## Results

| Cell | Overall (1–5) | Rank points (max 48) | Judged 1st (of 16) |
|---|---|---|---|
| **Opus + reference** | **4.74** | **43** | **12** |
| Opus control | 4.43 | 27 | 4 |
| **Sonnet + reference** | **4.38** | **17** | 0 |
| Sonnet control | 4.21 | 9 | 0 |

Treatment took 60 of 96 available rank points (62.5%) and 16 of 16 first places went to
Opus cells — 12 of those to Opus+reference.

Dimension means (treatment − control):

| Dimension | Opus Δ | Sonnet Δ |
|---|---|---|
| why | **+0.94** | +0.31 |
| placement | +0.69 | **+0.44** |
| needs: honesty | +0.38 | −0.07 |
| self-contained | +0.31 | +0.25 |
| dup handling | +0.31 | +0.13 |
| format | 0.00 | −0.12 |
| line limit | **−0.44** | +0.25 |

The reference's value concentrated exactly where it spends its words: capturing the *why*
(Opus control items often stated only the what), placement judgment, and self-containment.
Format was at ceiling everywhere (all 41 minted deltoids well-formed, zero collisions).

Per-scenario: treatment won terse, vague, multi-item, has-prerequisites, and re-add for both
models; control won context-rich for both models (see regression below) and split the
remaining two roughly evenly. The largest single gap was **re-add** (Opus 4.93 vs 3.71):
only Opus+reference consulted the ∆lRb journal entry deeply enough to reflect the
post-pivot design ("re-resolves `envValue`"), while Opus-control also misfiled the item
under the launch-blocking initiative — both judges independently flagged it.

## Regression: Opus + reference over-writes

Opus-treatment's one weak dimension (lineLimit 3.81 vs control 4.25) traces to exactly two
scenarios — context-rich and vague — where judges scored its items *best on content* but
2/5 on length for exceeding menschen's 5-line max (mean non-empty lines per item block:
Opus-treatment 7.0 vs Opus-control 6.1). The reference's "capture the why, name files and
decisions explicitly" push makes Opus pack more in; when the prompt already carries rich
context, that tips past the cap. Possible follow-up: sharpen the reference's terseness
bullet (e.g. "the why is one clause, not a paragraph; when the prompt is rich, compress
harder"). Notably, judges penalizing the treatment here is also evidence the blind judging
wasn't simply rewarding reference-style output.

## Verification performed

- Grep over all 16 control-generation transcripts: zero contained any reference content.
- All 32 sandboxes were modified; all 41 minted deltoids match `∆[A-Za-z0-9]{3}` with no
  collisions against backlog or journal (the one journal hit, ∆ols, is a legitimate
  cross-reference the prompt itself supplied).
- Spot-checked the near-duplicate and re-add scenarios: judge comments match the actual
  diffs (e.g. all four cells correctly refined toward ∆kkN instead of duplicating it).

## Caveats

- n = 8 scenarios × 2 judges; directionally consistent but not powered for significance.
- The rubric encodes the same philosophy as the reference (phrased neutrally as
  cold-reader tests, and length guidance was equalized — but a judge sharing the
  reference's values is inherent to this design).
- Judges and scenario designer are the same model family (Fable 5) as no cohort model.
- Generation agents had no subagent tool, so the reference's "dispatch a subagent to read
  the whole backlog" step was executed inline by the agent itself.

## Conclusion

The reference earns its tokens: with length guidance held constant, it improved overall
judged quality for both models (Opus +0.31, Sonnet +0.17 on a 5-point scale) and dominated
head-to-head rankings, with the biggest gains in exactly the behaviors it teaches —
capturing the why, placement, and grounding items in the journal. The one cost is Opus
occasionally exceeding the backlog's line cap when prompts are already context-rich; a
one-line terseness sharpening in the reference would likely recover it.
