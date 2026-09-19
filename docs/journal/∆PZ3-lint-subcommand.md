---
id: ∆PZ3
completed: 2026-09-19 22:51:26 +00:00
---

## Backlog item

> - ∆PZ3 `delto lint` — a `BACKLOG.md` structural linter (duplicate IDs, unresolved
>   `needs:` references, dependency cycles, oversized items): deterministic pass/fail checks,
>   distinct from the LLM-driven `refine` activity the skill owns. Last shipped as the legacy
>   `refine-backlog`/`lint-backlog.ts`, now in Git history

## Planning

Surfaced as the top eligible item and claimed. The legacy `skills/refine-backlog/
lint-backlog.ts` (recoverable at `3c635c5^`) served as the design reference, not a
straight port — it predates both the lib/bin split (ADR-001) and the removal of the
`touches:` edge, so four of its five checks carried over and the `touches:` symmetry
check was dropped (that edge's future is ∆NOp's question, not lint's).

Decisions worth recording:

- **Completed ids come from journal frontmatter, not filenames.** The legacy
  `journalIds` matched `∆xxx-*.md` names, but the skill lets users pick their own filename
  format while the spec makes the frontmatter `id:` field a MUST. The new
  `journalIds(journalDir)` in `src/lib/journal.ts` reads every file concurrently (the
  `takenIds` pattern) and extracts that field, skipping files without one (the README).
  Deliberately *not* reused: `mint`'s `takenIds`, which sweeps every `∆xxx` mention —
  journal prose routinely cross-references live items (∆GJ3's entry names ∆PZ3 itself),
  so it would have false-positived the duplicate check on this very repo.
- **`--journal-dir` is required**, matching `mint`. Two of the four checks need it (id
  reuse vs. completed entries; a `needs:` on a completed item is satisfied, not
  unresolved), and silently degrading a linter's checks when the flag is absent is worse
  than a usage error.
- **`--max-lines` flag, default 5.** The spec says the backlog self-documents its max item
  line count as prose the tool can't read, so the flag is the deterministic override.
  Validated like `mint --count` (positive integer only).
- **A brief SKILL.md entry, no eval.** Asked the user explicitly: CLAUDE.md wants skill
  changes validated by multi-agent evals, which is disproportionate for a factual
  subcommand listing, yet without one skill-only consumers never learn `lint` exists.
  Chosen: the entry, shipped as its own `docs(skill):` commit.

Layout is the house split: `lintBacklog(items, completedIds, maxLines): Violation[]` plus
exported `CHECKS` metadata in `src/lib/lint.ts`; `parseArgs`, `requireRepoRoot`, the
✓/✗ report, the `--json` verdict and the exit code in `src/bin/lint.ts`. Exit 0 clean,
1 on any violation.

## Refinement

- Red→green throughout; coverage held at 100/100/100/100 and `verify` stayed green.
  Dogfooded against this repo's own `BACKLOG.md` + `docs/journal`: clean.
- No PR was opened and the branch sat unmerged for weeks while `main` gained ∆Tmp's
  `bootstrap` subcommand. Landing it meant a rebase with exactly one conflict — the
  `SUBCOMMANDS` array in `src/bin/delto.ts`, both sides registering a new subcommand —
  resolved to `[bootstrap, …, complete, lint]`; the SKILL.md commit applied cleanly with
  `lint` after `complete`. Re-verified on the rebased result (142 tests), fast-forwarded
  `main`, pushed through the pre-push hook (`verify` + `test:pack`).
- The stale remote branch `claude/eloquent-turing-h7zco3` could not be deleted from the
  session: ref deletion returns HTTP 403 for the session's git credential, and the GitHub
  MCP surface has no delete-branch call. Left for the user; its content is fully on
  `main`.
- Removing ∆PZ3 emptied the “Beyond the v1.0 spec” initiative (∆Tmp had already gone), so
  the section came out with it.

## Retrospective

The code was the easy part; the lifecycle was the miss, and it is the same miss ∆Tmp's
entry recorded one item earlier. The implementing session ended with the work pushed but
neither merged nor `complete`d, so the claim went stale in the ledger (another live ∆diJ
specimen) and the backlog carried a shipped item as open until the user asked, weeks later,
whether it had ever merged. Two consecutive entries saying "completing the lifecycle
belongs in the definition of done" suggests prose alone isn't fixing it — ∆diJ's stale-claim
reporting is the tool-side half of that answer, and this is one more data point for it.

Smaller: `git push --delete` from a remote session should be assumed unavailable up front
rather than discovered by retrying through what looked like a proxy hiccup.

Nothing new filed; the frontmatter-vs-filename and `--max-lines` choices are documented
in `--help` and here, and nothing surfaced that isn't already covered by ∆diJ or ∆NOp.
