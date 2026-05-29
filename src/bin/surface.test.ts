import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { surface } from './surface.ts'
import { claim } from '../lib/claims-ledger.ts'

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

const RICH = [
  '# Backlog',
  '',
  '## Work',
  '',
  '- ∆aaa foundational',
  '- ∆bbb depends on aaa; needs: ∆aaa',
  '- ∆fff also depends on aaa; needs: ∆aaa',
  '- ∆ccc needs a completed thing; needs: ∆zzz',
  '- ∆ddd shares files; touches: ∆eee',
  '- ∆eee in progress',
  '- ∆ggg standalone',
  '',
].join('\n')

describe('delto surface', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'delto-surface-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })
  const writeBacklog = (body: string): void => {
    writeFileSync(join(dir, 'BACKLOG.md'), body)
  }

  it('prints help on --help', async () => {
    const stdout = new Capture()
    expect(await surface.run(['--help'], { stdout, cwd: dir })).toBe(0)
    expect(stdout.text).toContain('delto surface')
  })

  it('errors on an unknown flag', async () => {
    const stderr = new Capture()
    expect(await surface.run(['--bogus'], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('bogus')
  })

  it('errors when no BACKLOG.md is found', async () => {
    const stderr = new Capture()
    expect(await surface.run([], { stderr, cwd: dir })).toBe(1)
    expect(stderr.text).toContain('BACKLOG.md')
  })

  it('emits eligible deltoids with dependent counts in the human report', async () => {
    writeBacklog(RICH)
    claim(dir, 'eee')
    const stdout = new Capture()
    expect(await surface.run([], { stdout, cwd: dir })).toBe(0)
    const text = stdout.text
    expect(text).toContain('∆aaa →2')
    expect(text).toContain('∆ccc')
    expect(text).toContain('∆ggg')
    expect(text).not.toContain('∆bbb →') // bbb is excluded, not listed as eligible
    expect(text).toContain('other item(s)') // excluded-count note
  })

  it('reports eligibility and reasons as JSON', async () => {
    writeBacklog(RICH)
    claim(dir, 'eee')
    const stdout = new Capture()
    expect(await surface.run(['--json'], { stdout, cwd: dir })).toBe(0)
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
    expect(reasonOf('ddd')).toContain('∆eee')
    expect(reasonOf('eee')).toContain('claimed')
  })

  it('says so when nothing is eligible', async () => {
    writeBacklog(['## Work', '', '- ∆aaa only item', ''].join('\n'))
    claim(dir, 'aaa')
    const stdout = new Capture()
    expect(await surface.run([], { stdout, cwd: dir })).toBe(0)
    expect(stdout.text).toContain('(none')
  })

  it('omits the excluded note when every item is eligible', async () => {
    writeBacklog(['## Work', '', '- ∆aaa x', '- ∆bbb y', ''].join('\n'))
    const stdout = new Capture()
    expect(await surface.run([], { stdout, cwd: dir })).toBe(0)
    expect(stdout.text).toContain('∆aaa')
    expect(stdout.text).not.toContain('other item(s)')
  })
})
