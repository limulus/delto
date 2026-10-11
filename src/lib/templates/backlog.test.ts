import { describe, expect, it } from 'vitest'

import { renderBacklog } from './backlog.ts'
import { useTempRepo } from '../../mocks/temp-repo.ts'
import { parseBacklog } from '../backlog.ts'

describe('renderBacklog', () => {
  const repo = useTempRepo('delto-backlog-template-')

  it('names the journal dir only when it is not the default', () => {
    expect(renderBacklog({ journalDir: 'docs/journal' })).not.toContain('journaled')
    expect(renderBacklog({ journalDir: 'notes/log' })).toContain(
      '\n\nCompleted work is journaled in `notes/log/`.\n\n'
    )
  })

  it('names the delto skill as the authoring authority', () => {
    expect(renderBacklog({ journalDir: 'docs/journal' })).toContain(
      'managed with the [delto](https://github.com/limulus/delto) skill'
    )
  })

  it('leaves the conventions to the skill', () => {
    const text = renderBacklog({ journalDir: 'docs/journal' })
    expect(text).not.toContain('needs:')
    expect(text).not.toContain('∆')
  })

  it('starts with the standing Refactors initiative', () => {
    const headings = renderBacklog({ journalDir: 'docs/journal' })
      .split('\n')
      .filter((line) => line.startsWith('#'))
    expect(headings).toEqual(['# Backlog', '## Refactors'])
  })

  it('renders zero parseable backlog items', () => {
    repo.writeBacklog(renderBacklog({ journalDir: 'docs/journal' }))
    expect(parseBacklog(repo.dir)).toEqual([])
  })

  it('ends with a trailing newline', () => {
    expect(renderBacklog({ journalDir: 'docs/journal' })).toMatch(/\n$/)
  })
})
