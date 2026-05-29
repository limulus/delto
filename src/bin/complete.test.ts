import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { complete } from './complete.ts'
import { claim, claimedIds } from '../lib/claims-ledger.ts'

class Capture {
  private readonly chunks: string[] = []
  write(chunk: string): boolean {
    this.chunks.push(chunk)
    return true
  }
  get text(): string {
    return this.chunks.join('')
  }
}

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
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'delto-complete-'))
    writeFileSync(join(dir, 'BACKLOG.md'), BACKLOG)
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('prints help on --help', async () => {
    const stdout = new Capture()
    expect(await complete.run(['--help'], { stdout, cwd: dir })).toBe(0)
    expect(stdout.text).toContain('delto complete')
  })

  it('errors on an unknown flag', async () => {
    const stderr = new Capture()
    expect(await complete.run(['--bogus'], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('bogus')
  })

  it('errors when the deltoid or path is missing', async () => {
    for (const argv of [[], ['∆abc']]) {
      const stderr = new Capture()
      expect(await complete.run(argv, { stderr, cwd: dir })).toBe(1)
      expect(stderr.text).toContain('usage')
    }
  })

  it('errors when given too many arguments', async () => {
    const stderr = new Capture()
    expect(await complete.run(['∆abc', 'a.md', 'extra'], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('too many')
  })

  it('errors on a malformed deltoid', async () => {
    const stderr = new Capture()
    expect(await complete.run(['nope!', 'a.md'], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('not a valid deltoid')
  })

  it('errors when no BACKLOG.md is found', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'delto-complete-empty-'))
    const stderr = new Capture()
    expect(await complete.run(['∆abc', 'a.md'], { stderr, cwd: empty })).toBe(1)
    expect(stderr.text).toContain('BACKLOG.md')
    rmSync(empty, { recursive: true, force: true })
  })

  it('errors when the item is not in BACKLOG.md', async () => {
    const stderr = new Capture()
    expect(await complete.run(['∆zzz', 'a.md'], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('not in BACKLOG.md')
  })

  it('refuses to overwrite an existing journal file', async () => {
    mkdirSync(join(dir, 'docs', 'journal'), { recursive: true })
    writeFileSync(join(dir, 'docs', 'journal', 'taken.md'), 'existing\n')
    const stderr = new Capture()
    expect(
      await complete.run(['∆abc', 'docs/journal/taken.md'], { stderr, cwd: dir })
    ).toBe(1)
    expect(stderr.text).toContain('already exists')
  })

  it('scaffolds a journal entry, creates parent dirs, and releases the claim', async () => {
    claim(dir, 'abc')
    expect(claimedIds(dir).has('abc')).toBe(true)

    const stdout = new Capture()
    const rel = 'docs/journal/∆abc-thing.md'
    expect(await complete.run(['∆abc', rel], { stdout, cwd: dir })).toBe(0)

    const written = readFileSync(join(dir, rel), 'utf8')
    expect(written).toContain('id: ∆abc')
    expect(written).toMatch(/^completed: \d{4}-\d\d-\d\d \d\d:\d\d:\d\d [+-]\d\d:\d\d$/m)
    expect(written).toContain('> - ∆abc do the thing across')
    expect(written).toContain('>   two lines')
    expect(written).toContain('## Retrospective')

    expect(claimedIds(dir).has('abc')).toBe(false)
    expect(stdout.text).toContain('Completed ∆abc')
    expect(stdout.text).toContain(rel)
  })

  it('accepts a deltoid without the ∆ sigil', async () => {
    const stdout = new Capture()
    expect(await complete.run(['abc', 'out.md'], { stdout, cwd: dir })).toBe(0)
    expect(readFileSync(join(dir, 'out.md'), 'utf8')).toContain('id: ∆abc')
  })
})
