import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { mint } from './mint.ts'
import { Capture } from '../mocks/capture.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

describe('delto mint', () => {
  const repo = useTempRepo('delto-mint-bin-')
  const makeJournal = (): string => {
    const dir = repo.path('docs', 'journal')
    mkdirSync(dir, { recursive: true })
    return dir
  }

  it('prints help on --help and writes nothing to stderr', async () => {
    const stdout = new Capture()
    const stderr = new Capture()
    expect(await mint.run(['--help'], { stdout, stderr, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('delto mint')
    expect(stdout.text).toContain('--journal-dir')
    expect(stderr.text).toBe('')
  })

  it('errors when --journal-dir is missing', async () => {
    const stderr = new Capture()
    expect(await mint.run([], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('--journal-dir')
  })

  it('errors when --count is not a positive integer', async () => {
    for (const bad of ['0', '-2', 'abc', '1.5', '0x10', '1e3', ' 3']) {
      const stderr = new Capture()
      const code = await mint.run(['--journal-dir', repo.path('j'), '--count', bad], {
        stderr,
        cwd: repo.dir,
      })
      expect(code).toBe(1)
      expect(stderr.text).toContain('--count')
    }
  })

  it('errors when more ids are requested than the id space allows', async () => {
    repo.writeBacklog('- ∆abc x\n')
    const stderr = new Capture()
    const code = await mint.run(['--journal-dir', makeJournal(), '--count', '999999'], {
      stderr,
      cwd: repo.dir,
    })
    expect(code).toBe(1)
    expect(stderr.text).toContain('id space')
  })

  it('errors when no BACKLOG.md is found', async () => {
    const stderr = new Capture()
    expect(
      await mint.run(['--journal-dir', makeJournal()], { stderr, cwd: repo.dir })
    ).toBe(1)
    expect(stderr.text).toContain('BACKLOG.md')
  })

  it('errors on an unknown flag', async () => {
    const stderr = new Capture()
    expect(await mint.run(['--bogus'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('bogus')
  })

  it('mints one fresh deltoid by default, avoiding ids in BACKLOG.md and the journal', async () => {
    repo.writeBacklog('- ∆abc x\n')
    const journal = makeJournal()
    writeFileSync(join(journal, '∆def-done.md'), 'id: ∆def\n')
    const stdout = new Capture()
    expect(
      await mint.run(['--journal-dir', 'docs/journal'], { stdout, cwd: repo.dir })
    ).toBe(0)
    const lines = stdout.text.trim().split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/^∆[A-Za-z0-9]{3}$/)
    expect(['∆abc', '∆def']).not.toContain(lines[0])
  })

  it('mints --count fresh, distinct deltoids', async () => {
    repo.writeBacklog('- ∆abc x\n- ∆ghi y\n')
    const journal = makeJournal()
    const stdout = new Capture()
    expect(
      await mint.run(['--journal-dir', journal, '--count', '3'], { stdout, cwd: repo.dir })
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
