import { formatInTimeZone } from 'date-fns-tz'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ID } from './backlog.ts'

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
 * The deltoid body of every completed entry in `journalDir`, read from each file's
 * frontmatter `id:` field — the one thing the spec requires of an entry, whatever its
 * filename. Deliberately narrower than `takenIds` (src/lib/mint.ts), which sweeps every
 * `∆xxx` mention: entry prose routinely cross-references still-live items, and counting
 * those as completed would be wrong. Files without a frontmatter id (e.g. a README) are
 * skipped; a missing directory yields an empty set.
 */
export async function journalIds(journalDir: string): Promise<Set<string>> {
  const ids = new Set<string>()
  if (!existsSync(journalDir)) return ids
  const files = (await readdir(journalDir, { withFileTypes: true }))
    .filter((ent) => ent.isFile())
    .map((ent) => join(journalDir, ent.name))
  for (const text of await Promise.all(files.map((f) => readFile(f, 'utf8')))) {
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
    if (!frontmatter) continue
    const m = new RegExp(`^id:\\s*∆(${ID})\\s*$`, 'm').exec(frontmatter[1])
    if (m) ids.add(m[1])
  }
  return ids
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
