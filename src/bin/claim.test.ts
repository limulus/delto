import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { claim } from './claim.ts'
import { claimedIds } from '../lib/claims-ledger.ts'

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

describe('delto claim', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'delto-claim-bin-'))
    writeFileSync(join(dir, 'BACKLOG.md'), '- ∆abc x\n')
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('prints help on --help', async () => {
    const stdout = new Capture()
    expect(await claim.run(['--help'], { stdout, cwd: dir })).toBe(0)
    expect(stdout.text).toContain('delto claim')
  })

  it('errors when no deltoid is given', async () => {
    const stderr = new Capture()
    expect(await claim.run([], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('required')
  })

  it('errors when more than one deltoid is given', async () => {
    const stderr = new Capture()
    expect(await claim.run(['∆abc', '∆def'], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('only one')
  })

  it('errors on a malformed deltoid', async () => {
    const stderr = new Capture()
    expect(await claim.run(['nope!'], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('not a valid deltoid')
  })

  it('errors when no BACKLOG.md is found', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'delto-claim-empty-'))
    const stderr = new Capture()
    expect(await claim.run(['∆abc'], { stderr, cwd: empty })).toBe(1)
    expect(stderr.text).toContain('BACKLOG.md')
    rmSync(empty, { recursive: true, force: true })
  })

  it('errors on an unknown flag', async () => {
    const stderr = new Capture()
    expect(await claim.run(['--bogus'], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('bogus')
  })

  it('records a claim (with or without the ∆ sigil) and reports the ledger path', async () => {
    const stdout = new Capture()
    expect(await claim.run(['∆abc'], { stdout, cwd: dir })).toBe(0)
    expect(stdout.text).toContain('Claimed ∆abc')
    expect(stdout.text).toContain('.delto-claims.local.jsonl')
    expect(claimedIds(dir).has('abc')).toBe(true)

    const bare = new Capture()
    expect(await claim.run(['def'], { stdout: bare, cwd: dir })).toBe(0)
    expect(claimedIds(dir).has('def')).toBe(true)
  })
})
