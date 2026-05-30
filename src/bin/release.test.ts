import { describe, expect, it } from 'vitest'

import { release } from './release.ts'
import { claim, claimedIds } from '../lib/claims-ledger.ts'
import { Capture } from '../mocks/capture.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

describe('delto release', () => {
  const repo = useTempRepo('delto-release-bin-')

  it('prints help on --help', async () => {
    const stdout = new Capture()
    expect(await release.run(['--help'], { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('delto release')
  })

  it('withdraws a prior claim and reports it', async () => {
    repo.writeBacklog('- ∆abc x\n')
    claim(repo.dir, 'abc')
    expect(claimedIds(repo.dir).has('abc')).toBe(true)

    const stdout = new Capture()
    expect(await release.run(['∆abc'], { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('Released ∆abc')
    expect(claimedIds(repo.dir).has('abc')).toBe(false)
  })

  it('releasing an unclaimed item is a harmless no-op', async () => {
    repo.writeBacklog('- ∆abc x\n')
    const stdout = new Capture()
    expect(await release.run(['∆abc'], { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('Released ∆abc')
    expect(claimedIds(repo.dir).size).toBe(0)
  })
})
