import { describe, expect, it } from 'vitest'

import { renderJournalReadme } from './journal-readme.ts'

const params = { journalDir: 'docs/journal', distilledAt: '2026-01-02 03:04:05 -07:00' }

describe('renderJournalReadme', () => {
  it('documents the journal conventions', () => {
    const text = renderJournalReadme(params)
    expect(text).toContain('∆xxx-slug.md')
    expect(text).toContain('`id`')
    expect(text).toContain('`completed`')
    expect(text).toContain('YYYY-MM-DD HH:MM:SS ±HH:MM')
    expect(text).toContain('not chronological')
    expect(text).toContain('[[∆xxx]]')
  })

  it('embeds the distilledAt datetime in the watermark line', () => {
    expect(renderJournalReadme(params)).toContain(
      '**Last distilled: 2026-01-02 03:04:05 -07:00.**'
    )
  })

  it('carries the distillation review procedure', () => {
    const text = renderJournalReadme(params)
    expect(text).toContain("grep -H '^completed:' docs/journal/∆*.md")
    expect(text).toContain('at or before the watermark')
    expect(text).toContain('verify every concrete claim')
    expect(text).toContain('advance the watermark')
  })

  it('embeds the journal dir in the grep example', () => {
    expect(renderJournalReadme({ ...params, journalDir: 'notes/log' })).toContain(
      "grep -H '^completed:' notes/log/∆*.md"
    )
  })

  it('ends with a trailing newline', () => {
    expect(renderJournalReadme(params)).toMatch(/\n$/)
  })
})
