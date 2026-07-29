# Does the skill route fresh-project setup to `delto bootstrap`?

**Date:** 2026-07-29 · **Verdict: 3/3 runs produced correct artifacts; both with-skill runs
routed to the tool.** No agent hand-authored a `BACKLOG.md`. The baseline datum is
directionally positive but contaminated (see honest limits).

## Question

[[∆Tmp]] added the `bootstrap` subcommand and a new `### bootstrap` routing trigger to
`SKILL.md` ("the user wants to start using delto in a project that has no `BACKLOG.md`").
Do agents actually route setup requests to the tool instead of hand-authoring starter
files — including from indirect phrasing that never says "delto"? And do the materialized
artifacts survive contact with a real pre-existing `.gitignore`?

## Design

- **Substrate:** a synthetic bare consumer ("wavelength", a 3-file tide-clock widget:
  `package.json`, `README.md`, `src/index.js`), copied into 3 isolated sandboxes, each with
  its own `git init` and baseline commit. Unlike the [[∆CTB]]/[[∆Hp7]] substrates, no delto
  context exists beyond a CLAUDE.md note remapping `npx @limulus/delto@1` to the local
  checkout (this box is offline from npm). Sandbox 2's baseline additionally committed a
  `.gitignore` (`node_modules/`) to exercise the append path. Sandboxes 1–2 had the skill
  copied to `.claude/skills/delto/`; sandbox 3 had none.
- **Runs:** 3 agents, one per sandbox — skill + direct prompt ("I'd like to start using
  delto in this project"), skill + indirect prompt ("Set this project up with a backlog and
  a completed-work journal"), and a no-skill baseline with the direct prompt.
- **Grading:** ground truth only — `git status`/`git diff` against each baseline commit,
  plus byte-comparison of `BACKLOG.md` and the journal README against
  `renderBacklog`/`renderJournalReadme` output (watermark normalized), never the run
  agent's self-report.

## Results

| Scenario | Prompt | Result | Pass |
|----------|--------|--------|------|
| skill-direct (s1) | "I'd like to start using delto in this project" | Read SKILL.md → ran `bootstrap` (after `--help`); all 3 artifacts byte-identical to templates; offered `add` next, matching the trigger prose | ✅ |
| skill-indirect (s2) | "Set this project up with a backlog and a completed-work journal" | Routed to `bootstrap` with no "delto" in the prompt; `.gitignore` diff was exactly the appended ledger block after a blank line; no other tracked changes | ✅ |
| baseline, no skill (s3) | same as s1 | Still reached `bootstrap` — via the checkout path the CLAUDE.md remap exposed; installed the skill per the `Next:` nudge and smoke-tested `surface`/`mint` (both read-only — no stray ledger) | ✅* |

## Findings

1. **Routing works, direct and indirect.** Both with-skill runs invoked the tool rather
   than hand-authoring, including from phrasing that never named delto. Zero improvised
   `BACKLOG.md`s across all runs.
2. **The append path held on a real tracked `.gitignore`** — the diff was exactly the
   comment + pattern block, blank-line separated, nothing else touched.
3. **The `Next:` nudge did its job.** s3 installed the skill because the bootstrap output
   told it to; s1/s2 offered `add` as the follow-up, echoing the trigger prose.
4. **The baseline is contaminated, not clean.** The offline-remap note necessarily names
   the local checkout, and the s3 agent read the skill from it before acting. It still
   shows `bootstrap` is discoverable without an installed skill (`--help` lists it first),
   but a true no-skill datum needs a substrate whose remap hides the checkout's prose
   (e.g. a shim binary on PATH).

## Honest limits

n=1 per scenario, single model. The grader was the implementation's author (value-aligned),
though grading was mechanical byte-comparison against templates. The synthetic consumer is
tiny; a real repo with its own conventions (the [[∆Hp7]] pattern) would stress template
fit, not just routing. The s3 caveat above means the skill-vs-no-skill lift remains
unmeasured for bootstrap.
