import { formatInTimeZone } from 'date-fns-tz'

/**
 * Format a Date as the spec's `YYYY-MM-DD HH:MM:SS ±HH:MM` completion timestamp. `timeZone`
 * is an IANA zone name, defaulting to the system zone; it is injectable so both offset signs
 * are testable deterministically, independent of the test runner's timezone.
 */
export function formatCompleted(
  date: Date,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  return formatInTimeZone(date, timeZone, 'yyyy-MM-dd HH:mm:ss xxx')
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
