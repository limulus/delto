import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { mint } from './mint.ts'

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

describe('delto mint', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'delto-mint-bin-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })
  const writeBacklog = (body: string): void => {
    writeFileSync(join(dir, 'BACKLOG.md'), body)
  }
  const makeJournal = (): string => {
    const j = join(dir, 'docs', 'journal')
    mkdirSync(j, { recursive: true })
    return j
  }

  it('prints help on --help and writes nothing to stderr', async () => {
    const stdout = new Capture()
    const stderr = new Capture()
    expect(await mint.run(['--help'], { stdout, stderr, cwd: dir })).toBe(0)
    expect(stdout.text).toContain('delto mint')
    expect(stdout.text).toContain('--journal-dir')
    expect(stderr.text).toBe('')
  })

  it('errors when --journal-dir is missing', async () => {
    writeBacklog('- ∆abc x\n')
    const stderr = new Capture()
    expect(await mint.run([], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('--journal-dir')
  })

  it('errors when --count is not a positive integer', async () => {
    writeBacklog('- ∆abc x\n')
    const journal = makeJournal()
    for (const bad of ['0', '-2', 'abc', '1.5']) {
      const stderr = new Capture()
      const code = await mint.run(['--journal-dir', journal, '--count', bad], {
        stderr,
        cwd: dir,
      })
      expect(code).toBe(1)
      expect(stderr.text).toContain('--count')
    }
  })

  it('errors when no BACKLOG.md is found', async () => {
    const journal = makeJournal()
    const stderr = new Capture()
    expect(await mint.run(['--journal-dir', journal], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('BACKLOG.md')
  })

  it('errors on an unknown flag', async () => {
    const stderr = new Capture()
    expect(await mint.run(['--bogus'], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('bogus')
  })

  it('mints one fresh deltoid by default, avoiding ids in BACKLOG.md and the journal', async () => {
    writeBacklog('- ∆abc x\n')
    const journal = makeJournal()
    writeFileSync(join(journal, '∆def-done.md'), 'id: ∆def\n')
    const stdout = new Capture()
    expect(await mint.run(['--journal-dir', 'docs/journal'], { stdout, cwd: dir })).toBe(0)
    const lines = stdout.text.trim().split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/^∆[A-Za-z0-9]{3}$/)
    expect(['∆abc', '∆def']).not.toContain(lines[0])
  })

  it('mints --count fresh, distinct deltoids', async () => {
    writeBacklog('- ∆abc x\n- ∆ghi y\n')
    const journal = makeJournal()
    const stdout = new Capture()
    expect(
      await mint.run(['--journal-dir', journal, '--count', '3'], { stdout, cwd: dir })
    ).toBe(0)
    const ids = stdout.text.trim().split('\n')
    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
    for (const id of ids) {
      expect(id).toMatch(/^∆[A-Za-z0-9]{3}$/)
      expect(['∆abc', '∆ghi']).not.toContain(id)
    }
  })
})
