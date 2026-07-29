import { describe, expect, it } from 'vitest'

import { renderBacklog } from './backlog.ts'
import { useTempRepo } from '../../mocks/temp-repo.ts'
import { parseBacklog } from '../backlog.ts'

describe('renderBacklog', () => {
  const repo = useTempRepo('delto-backlog-template-')

  it('embeds the journal dir in the mint instruction', () => {
    expect(renderBacklog({ journalDir: 'docs/journal' })).toContain(
      'npx @limulus/delto@1 mint --journal-dir docs/journal'
    )
    expect(renderBacklog({ journalDir: 'notes/log' })).toContain(
      'npx @limulus/delto@1 mint --journal-dir notes/log'
    )
  })

  it('names the delto skill as the authoring authority', () => {
    expect(renderBacklog({ journalDir: 'docs/journal' })).toContain(
      'managed with the **delto** skill'
    )
  })

  it('self-documents the backlog conventions', () => {
    const text = renderBacklog({ journalDir: 'docs/journal' })
    expect(text).toContain('Initiative (`##`) → Epic (`###`) → Item (`-`)')
    expect(text).toContain('5 lines max')
    expect(text).toContain('3 alphanumerics')
    expect(text).toContain('; needs:')
  })

  it('renders zero parseable backlog items', () => {
    repo.writeBacklog(renderBacklog({ journalDir: 'docs/journal' }))
    expect(parseBacklog(repo.dir)).toEqual([])
  })

  it('ends with a trailing newline', () => {
    expect(renderBacklog({ journalDir: 'docs/journal' })).toMatch(/\n$/)
  })
})
