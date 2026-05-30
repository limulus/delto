import { describe, expect, it } from 'vitest'

import { claim } from './claim.ts'
import { claimedIds } from '../lib/claims-ledger.ts'
import { Capture } from '../mocks/capture.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

describe('delto claim', () => {
  const repo = useTempRepo('delto-claim-bin-')

  it('prints help on --help', async () => {
    const stdout = new Capture()
    expect(await claim.run(['--help'], { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('delto claim')
  })

  it('errors when no deltoid is given', async () => {
    const stderr = new Capture()
    expect(await claim.run([], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('required')
  })

  it('errors when more than one deltoid is given', async () => {
    const stderr = new Capture()
    expect(await claim.run(['∆abc', '∆def'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('only one')
  })

  it('errors on a malformed deltoid', async () => {
    const stderr = new Capture()
    expect(await claim.run(['nope!'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('not a valid deltoid')
  })

  it('errors when no BACKLOG.md is found', async () => {
    const stderr = new Capture()
    expect(await claim.run(['∆abc'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('BACKLOG.md')
  })

  it('errors on an unknown flag', async () => {
    const stderr = new Capture()
    expect(await claim.run(['--bogus'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('bogus')
  })

  it('records a claim (with or without the ∆ sigil) and reports the ledger path', async () => {
    repo.writeBacklog('- ∆abc x\n')
    const stdout = new Capture()
    expect(await claim.run(['∆abc'], { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('Claimed ∆abc')
    expect(stdout.text).toContain('.delto-claims.local.jsonl')
    expect(claimedIds(repo.dir).has('abc')).toBe(true)

    const bare = new Capture()
    expect(await claim.run(['def'], { stdout: bare, cwd: repo.dir })).toBe(0)
    expect(claimedIds(repo.dir).has('def')).toBe(true)
  })
})
