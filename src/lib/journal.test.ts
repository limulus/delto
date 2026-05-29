import { describe, expect, it } from 'vitest'

import { formatCompleted, journalEntry } from './journal.ts'

describe('formatCompleted', () => {
  it('formats a west-of-UTC offset', () => {
    expect(formatCompleted(new Date(2026, 0, 5, 3, 7, 9), -420)).toBe(
      '2026-01-05 03:07:09 -07:00'
    )
  })

  it('formats east-of-UTC and UTC offsets', () => {
    expect(formatCompleted(new Date(2026, 4, 29, 14, 30, 5), 330)).toBe(
      '2026-05-29 14:30:05 +05:30'
    )
    expect(formatCompleted(new Date(2026, 4, 29, 14, 30, 5), 0)).toBe(
      '2026-05-29 14:30:05 +00:00'
    )
  })

  it('defaults the offset to the date’s local timezone', () => {
    expect(formatCompleted(new Date(2026, 4, 29, 14, 30, 5))).toMatch(
      /^2026-05-29 14:30:05 [+-]\d\d:\d\d$/
    )
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
