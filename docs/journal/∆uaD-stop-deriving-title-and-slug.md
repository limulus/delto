---
id: ∆uaD
date: 2026-05-25
title: 'Stop deriving journal title and slug'
---

## Backlog item

> - ∆uaD Remove `complete-item.ts`'s title/slug auto-derivation entirely — picking a
>   good title from a backlog bullet is LLM judgment, not regex work, and the
>   fallback has produced unusable defaults on every recent completion. Make
>   `--title` and `--slug` required (keep the slug-format validator), and update
>   `SKILL.md` to instruct the agent to pick them from the item before invoking

## Planning

The item entered the backlog (one commit prior) as "fix the derivation heuristic" —
strip backticks, cap title length, re-derive the slug from the trimmed title. The
reshape to "remove the feature" came from a one-line observation: picking a concise
title from a backlog bullet is exactly the kind of judgment LLMs do well and regexes
do poorly. Rather than thicken the heuristic, hand the job to the caller and have
the script enforce shape (kebab-case slug) rather than guess intent.

That settled three sub-decisions:

- **`--title` and `--slug` become required**, with clear missing-flag errors that
  point at what to pass. The slug-format regex stays as a guardrail.
- **`SKILL.md` owns the picking guidance** — step 2 describes what makes a good
  title (concise, paraphrase the bullet rather than mirror it) and slug (kebab-case,
  derived from the title), then runs the dry-run.
- **The script keeps its dry-run/real-run two-step.** Dry-run is still useful for
  previewing the `BACKLOG.md` deletion scope and the journal scaffold before
  committing to the write.

## Refinement

Two course-corrections during writing:

- **YAML safety belonged at the writer, not the reader.** The first draft of step 2
  warned the caller to keep backticks out of titles, because the previous template
  emitted `title: ${title}` unquoted. The user flagged that this was both
  technically inaccurate (backticks are only YAML-reserved at the start of unquoted
  scalars, fine elsewhere or in any quoted form) and the wrong layer — the script
  controls the only YAML field that takes arbitrary input, so it should produce
  valid output unconditionally. Folded auto-quoting into ∆uaD: wrap the title in a
  single-quoted YAML scalar with `''` escape for embedded apostrophes. Removes the
  caveat from `SKILL.md` and obviates any downstream YAML linter.
- **SKILL.md prose should read clean to a fresh agent.** My first additions to the
  "What the script does — and doesn't" section and step 2 leaked context — "the
  script no longer guesses," "not regex work," "Both are required; the script does
  not derive them." Rewrote to describe the current contract directly, with no
  reference to the prior behavior. The same principle would have caught the leak
  earlier if I had applied it on the first pass.

Smoke-tested via `--dry-run` for: missing `--title`, missing `--slug`, malformed
slug, happy-path output, and YAML quoting with a title containing backticks and
apostrophes. Skipped a real-write test before committing; flagged the gap explicitly
to the user. The `/delto complete uaD` real run (this commit) is the first
end-to-end exercise of the write path.

## Retrospective

Two prompts in a row caught me about to over-engineer — "is the public API
premature?" on ∆iDx, and "should we remove this feature instead of fixing it?"
here. The pattern: when a problem can be solved by either heuristic or judgment,
the heuristic looks like the right answer because it's mechanical, but the judgment
is usually better because it's situational. Default to "let the caller decide" when
the caller is an LLM that's already reading the surrounding context.

The "fix at the writer, not the reader" instinct generalizes: the YAML quoting
change was one helper line and eliminated the entire class of "title broke
frontmatter" bug, vs. the caller-side rule that would have required vigilance on
every completion. Worth applying the same lens to any future "the caller has to
remember to X" rules in skill prose.

The not-tested-end-to-end gap was real but bounded: dry-run prints `journalRel` and
`journalBody` in full, and the real-run delta is just `writeFileSync` + `release(id)`
on those exact values. Worth doing a throwaway real-run test next time the script
itself is what's under change, just to close the loop without relying on the next
completion to surface a bug.
