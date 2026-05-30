import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { complete } from './complete.ts'
import { claim, claimedIds } from '../lib/claims-ledger.ts'
import { Capture } from '../mocks/capture.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

const BACKLOG = [
  '# Backlog',
  '',
  '## Work',
  '',
  '- ∆abc do the thing across',
  '  two lines',
  '',
].join('\n')

describe('delto complete', () => {
  const repo = useTempRepo('delto-complete-')

  it('prints help on --help', async () => {
    const stdout = new Capture()
    expect(await complete.run(['--help'], { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('delto complete')
  })

  it('errors on an unknown flag', async () => {
    const stderr = new Capture()
    expect(await complete.run(['--bogus'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('bogus')
  })

  it('errors when the deltoid or path is missing', async () => {
    for (const argv of [[], ['∆abc']]) {
      const stderr = new Capture()
      expect(await complete.run(argv, { stderr, cwd: repo.dir })).toBe(1)
      expect(stderr.text).toContain('usage')
    }
  })

  it('errors when given too many arguments', async () => {
    const stderr = new Capture()
    expect(await complete.run(['∆abc', 'a.md', 'extra'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('too many')
  })

  it('errors on a malformed deltoid', async () => {
    const stderr = new Capture()
    expect(await complete.run(['nope!', 'a.md'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('not a valid deltoid')
  })

  it('errors when no BACKLOG.md is found', async () => {
    const stderr = new Capture()
    expect(await complete.run(['∆abc', 'a.md'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('BACKLOG.md')
  })

  it('errors when the item is not in BACKLOG.md', async () => {
    repo.writeBacklog(BACKLOG)
    const stderr = new Capture()
    expect(await complete.run(['∆zzz', 'a.md'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('not in BACKLOG.md')
  })

  it('refuses to overwrite an existing journal file', async () => {
    repo.writeBacklog(BACKLOG)
    mkdirSync(repo.path('docs', 'journal'), { recursive: true })
    writeFileSync(repo.path('docs', 'journal', 'taken.md'), 'existing\n')
    const stderr = new Capture()
    expect(
      await complete.run(['∆abc', 'docs/journal/taken.md'], { stderr, cwd: repo.dir })
    ).toBe(1)
    expect(stderr.text).toContain('already exists')
  })

  it('scaffolds a journal entry, creates parent dirs, and releases the claim', async () => {
    repo.writeBacklog(BACKLOG)
    claim(repo.dir, 'abc')
    expect(claimedIds(repo.dir).has('abc')).toBe(true)

    const stdout = new Capture()
    const rel = 'docs/journal/∆abc-thing.md'
    expect(await complete.run(['∆abc', rel], { stdout, cwd: repo.dir })).toBe(0)

    const written = readFileSync(repo.path(rel), 'utf8')
    expect(written).toContain('id: ∆abc')
    expect(written).toMatch(/^completed: \d{4}-\d\d-\d\d \d\d:\d\d:\d\d [+-]\d\d:\d\d$/m)
    expect(written).toContain('> - ∆abc do the thing across')
    expect(written).toContain('>   two lines')
    expect(written).toContain('## Retrospective')

    expect(claimedIds(repo.dir).has('abc')).toBe(false)
    expect(stdout.text).toContain('Completed ∆abc')
    expect(stdout.text).toContain(rel)
  })

  it('accepts a deltoid without the ∆ sigil', async () => {
    repo.writeBacklog(BACKLOG)
    const stdout = new Capture()
    expect(await complete.run(['abc', 'out.md'], { stdout, cwd: repo.dir })).toBe(0)
    expect(readFileSync(repo.path('out.md'), 'utf8')).toContain('id: ∆abc')
  })

  it('transcribes a clean blockquote from a CRLF BACKLOG.md', async () => {
    repo.writeBacklog(BACKLOG.replace(/\n/g, '\r\n'))
    const stdout = new Capture()
    expect(await complete.run(['∆abc', 'out.md'], { stdout, cwd: repo.dir })).toBe(0)
    const written = readFileSync(repo.path('out.md'), 'utf8')
    expect(written).toContain('> - ∆abc do the thing across')
    expect(written).not.toContain('\r')
  })
})
