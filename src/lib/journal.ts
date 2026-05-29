/**
 * Format a Date as the spec's `YYYY-MM-DD HH:MM:SS ±HH:MM` completion timestamp, using the
 * system-local wall clock. `offsetMinutes` is minutes east of UTC; it defaults from the
 * date but is injectable so both sign branches are testable without touching the system tz.
 */
export function formatCompleted(
  date: Date,
  offsetMinutes: number = -date.getTimezoneOffset()
): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  const ymd = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const hms = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  const sign = offsetMinutes < 0 ? '-' : '+'
  const abs = Math.abs(offsetMinutes)
  return `${ymd} ${hms} ${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/**
 * Scaffold a completion journal entry: spec frontmatter (`id` + `completed`), the item's
 * bullet transcribed verbatim into a blockquote, and TODO sections for the agent's prose.
 */
export function journalEntry(id: string, bulletLines: string[], completed: string): string {
  const quoted = bulletLines.map((line) => '> ' + line).join('\n')
  return `---
id: ∆${id}
completed: ${completed}
---

## Backlog item

${quoted}

## Planning

<!-- TODO: what was clarified or changed during planning — design decisions, scope
adjustments, trade-offs considered. Reference the plan file if useful. -->

## Refinement

<!-- TODO: what got adjusted post-implementation — surprises during coding, changes from
the plan, follow-ups deferred to new backlog items. -->

## Retrospective

<!-- TODO: what could have gone better, what to do differently next time. Honest and
short. -->
`
}
