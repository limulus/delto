import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { formatCompleted, journalEntry, journalIds } from './journal.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

describe('formatCompleted', () => {
  it('formats a west-of-UTC offset', () => {
    // Phoenix is UTC-7 year-round (no DST), so 10:07:09Z is 03:07:09 local.
    expect(formatCompleted(new Date('2026-01-05T10:07:09Z'), 'America/Phoenix')).toBe(
      '2026-01-05 03:07:09 -07:00'
    )
  })

  it('formats east-of-UTC and UTC offsets', () => {
    expect(formatCompleted(new Date('2026-05-29T09:00:05Z'), 'Asia/Kolkata')).toBe(
      '2026-05-29 14:30:05 +05:30'
    )
    expect(formatCompleted(new Date('2026-05-29T14:30:05Z'), 'UTC')).toBe(
      '2026-05-29 14:30:05 +00:00'
    )
  })

  it('defaults the zone to the system timezone', () => {
    expect(formatCompleted(new Date('2026-05-29T14:30:05Z'))).toMatch(
      /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d [+-]\d\d:\d\d$/
    )
  })
})

describe('journalIds', () => {
  const repo = useTempRepo('delto-journal-ids-')

  const entry = (id: string, body = ''): string =>
    `---\nid: ∆${id}\ncompleted: 2026-01-05 03:07:09 -07:00\n---\n\n${body}\n`

  it('returns an empty set when the journal directory does not exist', async () => {
    expect(await journalIds(repo.path('docs', 'journal'))).toEqual(new Set())
  })

  it('collects the frontmatter id of each entry', async () => {
    const dir = repo.path('journal')
    mkdirSync(dir)
    writeFileSync(join(dir, '∆abc-thing.md'), entry('abc'))
    writeFileSync(join(dir, 'custom-name.md'), entry('xyz'))
    expect(await journalIds(dir)).toEqual(new Set(['abc', 'xyz']))
  })

  it('ignores deltoid mentions in entry prose and files without a frontmatter id', async () => {
    const dir = repo.path('journal')
    mkdirSync(dir)
    writeFileSync(join(dir, '∆abc-thing.md'), entry('abc', 'Superseded by ∆zzz.'))
    writeFileSync(join(dir, 'README.md'), 'Journal of completed items like ∆qqq.\n')
    writeFileSync(join(dir, 'no-id.md'), '---\ncompleted: whenever\n---\n')
    expect(await journalIds(dir)).toEqual(new Set(['abc']))
  })

  it('skips subdirectories', async () => {
    const dir = repo.path('journal')
    mkdirSync(join(dir, 'archive'), { recursive: true })
    writeFileSync(join(dir, '∆abc-thing.md'), entry('abc'))
    expect(await journalIds(dir)).toEqual(new Set(['abc']))
  })
})

describe('journalEntry', () => {
  it('scaffolds spec frontmatter, the bullet blockquote, and TODO sections', () => {
    const entry = journalEntry(
      'abc',
      ['- ∆abc do a thing', '  with more detail'],
      '2026-05-29 06:00:00 +00:00'
    )
    expect(entry).toContain('id: ∆abc')
    expect(entry).toContain('completed: 2026-05-29 06:00:00 +00:00')
    expect(entry).toContain('## Backlog item')
    expect(entry).toContain('> - ∆abc do a thing')
    expect(entry).toContain('>   with more detail')
    expect(entry).toContain('## Planning')
    expect(entry).toContain('## Refinement')
    expect(entry).toContain('## Retrospective')
  })
})
