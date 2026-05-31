import { describe, expect, it } from 'vitest'

import { surface } from './surface.ts'
import { claim } from '../lib/claims-ledger.ts'
import { Capture } from '../mocks/capture.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

const RICH = [
  '# Backlog',
  '',
  '## Work',
  '',
  '- ∆aaa foundational',
  '- ∆bbb depends on aaa; needs: ∆aaa',
  '- ∆fff also depends on aaa; needs: ∆aaa',
  '- ∆ccc needs a completed thing; needs: ∆zzz',
  '- ∆eee in progress',
  '- ∆ggg standalone',
  '',
].join('\n')

describe('delto surface', () => {
  const repo = useTempRepo('delto-surface-')

  it('prints help on --help', async () => {
    const stdout = new Capture()
    expect(await surface.run(['--help'], { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('delto surface')
  })

  it('errors on an unknown flag', async () => {
    const stderr = new Capture()
    expect(await surface.run(['--bogus'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('bogus')
  })

  it('errors when no BACKLOG.md is found', async () => {
    const stderr = new Capture()
    expect(await surface.run([], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('BACKLOG.md')
  })

  it('emits eligible deltoids with dependent counts in the human report', async () => {
    repo.writeBacklog(RICH)
    claim(repo.dir, 'eee')
    const stdout = new Capture()
    expect(await surface.run([], { stdout, cwd: repo.dir })).toBe(0)
    const text = stdout.text
    expect(text).toContain('∆aaa →2')
    expect(text).toContain('∆ccc')
    expect(text).toContain('∆ggg')
    expect(text).not.toContain('∆bbb →')
    expect(text).toContain('other item(s)')
  })

  it('reports eligibility and reasons as JSON', async () => {
    repo.writeBacklog(RICH)
    claim(repo.dir, 'eee')
    const stdout = new Capture()
    expect(await surface.run(['--json'], { stdout, cwd: repo.dir })).toBe(0)
    const report = JSON.parse(stdout.text)
    expect(report.eligible.map((e: { id: string }) => e.id)).toEqual(['aaa', 'ccc', 'ggg'])
    expect(report.eligible.find((e: { id: string }) => e.id === 'aaa').unblocks).toEqual([
      'bbb',
      'fff',
    ])
    expect(report.claimed).toEqual(['eee'])
    const reasonOf = (id: string): string =>
      report.excluded.find((e: { id: string }) => e.id === id).reason
    expect(reasonOf('bbb')).toContain('needs ∆aaa')
    expect(reasonOf('eee')).toContain('claimed')
  })

  it('joins multiple reasons when an item is both claimed and needs-blocked', async () => {
    repo.writeBacklog(
      ['## Work', '', '- ∆aaa base', '- ∆bbb dependent; needs: ∆aaa', ''].join('\n')
    )
    claim(repo.dir, 'bbb')
    const stdout = new Capture()
    expect(await surface.run(['--json'], { stdout, cwd: repo.dir })).toBe(0)
    const report = JSON.parse(stdout.text)
    const bbb = report.excluded.find((e: { id: string }) => e.id === 'bbb')
    expect(bbb.reason).toBe('in-flight (claimed); needs ∆aaa')
  })

  it('says so when nothing is eligible', async () => {
    repo.writeBacklog(['## Work', '', '- ∆aaa only item', ''].join('\n'))
    claim(repo.dir, 'aaa')
    const stdout = new Capture()
    expect(await surface.run([], { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('(none')
    // the `→N` legend explains notation that only appears beside eligible items
    expect(stdout.text).not.toContain('unblocks them')
  })

  it('omits the excluded note when every item is eligible', async () => {
    repo.writeBacklog(['## Work', '', '- ∆aaa x', '- ∆bbb y', ''].join('\n'))
    const stdout = new Capture()
    expect(await surface.run([], { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('∆aaa')
    expect(stdout.text).not.toContain('other item(s)')
  })
})
