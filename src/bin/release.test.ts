import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { release } from './release.ts'
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

describe('delto release', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'delto-release-bin-'))
    writeFileSync(join(dir, 'BACKLOG.md'), '- ∆abc x\n')
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('prints help on --help', async () => {
    const stdout = new Capture()
    expect(await release.run(['--help'], { stdout, cwd: dir })).toBe(0)
    expect(stdout.text).toContain('delto release')
  })

  it('withdraws a prior claim and reports it', async () => {
    claim(dir, 'abc')
    expect(claimedIds(dir).has('abc')).toBe(true)

    const stdout = new Capture()
    expect(await release.run(['∆abc'], { stdout, cwd: dir })).toBe(0)
    expect(stdout.text).toContain('Released ∆abc')
    expect(claimedIds(dir).has('abc')).toBe(false)
  })

  it('releasing an unclaimed item is a harmless no-op', async () => {
    const stdout = new Capture()
    expect(await release.run(['∆abc'], { stdout, cwd: dir })).toBe(0)
    expect(stdout.text).toContain('Released ∆abc')
    expect(claimedIds(dir).size).toBe(0)
  })
})
