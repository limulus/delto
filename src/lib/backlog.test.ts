import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { findRepoRoot, ID, parseBacklog, suffixIds } from './backlog.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

describe('findRepoRoot', () => {
  const repo = useTempRepo('delto-backlog-')

  it('returns the directory that holds BACKLOG.md', () => {
    repo.writeBacklog('# Backlog\n')
    expect(findRepoRoot(repo.dir)).toBe(repo.dir)
  })

  it('walks up to an ancestor BACKLOG.md', () => {
    repo.writeBacklog('# Backlog\n')
    const nested = repo.path('packages', 'foo')
    mkdirSync(nested, { recursive: true })
    expect(findRepoRoot(nested)).toBe(repo.dir)
  })

  it('returns the nearest BACKLOG.md when several exist (monorepo: nearest wins)', () => {
    repo.writeBacklog('# root\n')
    const pkg = repo.path('packages', 'foo')
    mkdirSync(pkg, { recursive: true })
    writeFileSync(join(pkg, 'BACKLOG.md'), '# foo\n')
    expect(findRepoRoot(pkg)).toBe(pkg)
  })

  it('returns undefined when no BACKLOG.md exists in any parent', () => {
    expect(findRepoRoot(repo.dir)).toBeUndefined()
  })
})

describe('ID', () => {
  it('matches a 3-char alphanumeric deltoid body and nothing else', () => {
    const re = new RegExp(`^${ID}$`)
    expect(re.test('a9Z')).toBe(true)
    expect(re.test('ab')).toBe(false)
    expect(re.test('abcd')).toBe(false)
    expect(re.test('ab-')).toBe(false)
  })
})

describe('suffixIds', () => {
  it('extracts the ids from a labelled dependency suffix', () => {
    expect(suffixIds('do a thing; needs: ∆aaa, ∆bbb', 'needs')).toEqual(['aaa', 'bbb'])
    expect(suffixIds('do a thing; touches: ∆ccc', 'touches')).toEqual(['ccc'])
  })

  it('returns an empty array when the label is absent', () => {
    expect(suffixIds('no suffix here', 'needs')).toEqual([])
  })
})

describe('parseBacklog', () => {
  const repo = useTempRepo('delto-parse-')
  const parse = (body: string): ReturnType<typeof parseBacklog> => {
    repo.writeBacklog(body)
    return parseBacklog(repo.dir)
  }

  it('parses items in document order with their needs, touches, and heading context', () => {
    const items = parse(
      [
        '# Delto Backlog',
        '',
        'Intro prose, not an item.',
        '',
        '## Init One',
        '',
        '- ∆aaa first item',
        '- ∆bbb second; needs: ∆aaa, ∆ccc; touches: ∆ddd',
        '',
        '### Epic A',
        '',
        '- ∆ccc a wrapped item that runs',
        '  onto a second line; needs: ∆aaa',
        '',
        '## Init Two',
        '',
        '- ∆eee under an initiative directly',
        '',
      ].join('\n')
    )

    expect(items.map((i) => i.id)).toEqual(['aaa', 'bbb', 'ccc', 'eee'])

    const bbb = items[1]
    expect(bbb.needs).toEqual(['aaa', 'ccc'])
    expect(bbb.touches).toEqual(['ddd'])
    expect(bbb.initiativeHeading?.text).toBe('Init One')
    expect(bbb.epicHeading).toBeNull()

    const ccc = items[2]
    expect(ccc.lineCount).toBe(2)
    expect(ccc.needs).toEqual(['aaa'])
    expect(ccc.initiativeHeading?.text).toBe('Init One')
    expect(ccc.epicHeading?.text).toBe('Epic A')

    const eee = items[3]
    expect(eee.initiativeHeading?.text).toBe('Init Two')
    expect(eee.epicHeading).toBeNull()
  })

  it('tolerates a line that starts with # but is not a heading', () => {
    const items = parse(
      ['## Init', '', '- ∆aaa x', '#notaheading', '- ∆bbb y', ''].join('\n')
    )
    expect(items.map((i) => i.id)).toEqual(['aaa', 'bbb'])
    expect(items[1].initiativeHeading?.text).toBe('Init')
  })

  it('parses a BACKLOG.md with CRLF line endings', () => {
    const items = parse(
      ['## Init', '', '- ∆aaa first; needs: ∆bbb', '- ∆bbb second', ''].join('\r\n')
    )
    expect(items.map((i) => i.id)).toEqual(['aaa', 'bbb'])
    expect(items[0].needs).toEqual(['bbb'])
    expect(items[0].initiativeHeading?.text).toBe('Init')
  })
})
