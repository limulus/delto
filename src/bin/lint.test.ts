import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { lint } from './lint.ts'
import { Capture } from '../mocks/capture.ts'
import { useTempRepo, type TempRepo } from '../mocks/temp-repo.ts'

const CLEAN = [
  '# Backlog',
  '',
  '## Work',
  '',
  '- ∆aaa foundational',
  '- ∆bbb depends on aaa; needs: ∆aaa',
  '- ∆ccc needs a completed thing; needs: ∆ddd',
  '',
].join('\n')

const DIRTY = [
  '# Backlog',
  '',
  '## Work',
  '',
  '- ∆aaa duplicated below',
  '- ∆aaa duplicated above',
  '- ∆bbb refers to nothing; needs: ∆zzz',
  '- ∆ccc cycles with eee; needs: ∆eee',
  '- ∆eee cycles with ccc; needs: ∆ccc',
  '- ∆fff wraps across six lines',
  '  two',
  '  three',
  '  four',
  '  five',
  '  six',
  '',
].join('\n')

function writeJournal(repo: TempRepo, ...ids: string[]): void {
  const dir = repo.path('docs', 'journal')
  mkdirSync(dir, { recursive: true })
  for (const id of ids) {
    writeFileSync(
      join(dir, `∆${id}-done.md`),
      `---\nid: ∆${id}\ncompleted: 2026-01-05 03:07:09 -07:00\n---\n`
    )
  }
}

describe('delto lint', () => {
  const repo = useTempRepo('delto-lint-')
  const journalArgs = ['--journal-dir', 'docs/journal']

  it('prints help on --help', async () => {
    const stdout = new Capture()
    expect(await lint.run(['--help'], { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('delto lint')
    expect(stdout.text).toContain('--journal-dir')
  })

  it('errors on an unknown flag', async () => {
    const stderr = new Capture()
    expect(await lint.run(['--bogus'], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('bogus')
  })

  it('errors when --journal-dir is missing', async () => {
    const stderr = new Capture()
    expect(await lint.run([], { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('--journal-dir')
  })

  it('errors on a non-positive or non-numeric --max-lines', async () => {
    for (const bad of ['0', '-2', 'five', '2.5']) {
      const stderr = new Capture()
      expect(
        await lint.run([...journalArgs, '--max-lines', bad], { stderr, cwd: repo.dir })
      ).toBe(1)
      expect(stderr.text).toContain('--max-lines')
    }
  })

  it('errors when no BACKLOG.md is found', async () => {
    const stderr = new Capture()
    expect(await lint.run(journalArgs, { stderr, cwd: repo.dir })).toBe(1)
    expect(stderr.text).toContain('BACKLOG.md')
  })

  it('passes a clean backlog with a ✓ per check and exit 0', async () => {
    repo.writeBacklog(CLEAN)
    writeJournal(repo, 'ddd')
    const stdout = new Capture()
    expect(await lint.run(journalArgs, { stdout, cwd: repo.dir })).toBe(0)
    expect(stdout.text).toContain('clean')
    expect(stdout.text).toContain('3 item')
    expect(stdout.text.match(/✓/g)).toHaveLength(4)
    expect(stdout.text).not.toContain('✗')
  })

  it('reports violations from every check with ✗ lines and exit 1', async () => {
    repo.writeBacklog(DIRTY)
    writeJournal(repo, 'bbb')
    const stdout = new Capture()
    expect(await lint.run(journalArgs, { stdout, cwd: repo.dir })).toBe(1)
    const text = stdout.text
    expect(text).toContain('5 violation(s)')
    expect(text.match(/✗/g)).toHaveLength(4)
    expect(text).toContain('∆aaa is used by 2 items (lines 5, 6)')
    expect(text).toContain('∆bbb (line 7) reuses the ID of a completed journal entry')
    expect(text).toContain('needs: ∆zzz')
    expect(text).toContain('∆ccc → ∆eee → ∆ccc')
    expect(text).toContain('∆fff (line 10) spans 6 lines (max 5)')
    expect(text).toContain('re-run')
  })

  it('honors --max-lines', async () => {
    repo.writeBacklog(['## Work', '', '- ∆aaa wraps', '  once', ''].join('\n'))
    const stdout = new Capture()
    expect(
      await lint.run([...journalArgs, '--max-lines', '1'], { stdout, cwd: repo.dir })
    ).toBe(1)
    expect(stdout.text).toContain('∆aaa (line 3) spans 2 lines (max 1)')
  })

  it('emits the verdict as JSON', async () => {
    repo.writeBacklog(DIRTY)
    const stdout = new Capture()
    expect(await lint.run([...journalArgs, '--json'], { stdout, cwd: repo.dir })).toBe(1)
    const report = JSON.parse(stdout.text)
    expect(report.ok).toBe(false)
    expect(report.itemCount).toBe(6)
    expect(report.checks.map((c: { key: string }) => c.key)).toEqual([
      'duplicate-ids',
      'unresolved-refs',
      'needs-cycles',
      'oversized-items',
    ])
    const check = (key: string) => report.checks.find((c: { key: string }) => c.key === key)
    expect(check('duplicate-ids').ok).toBe(false)
    expect(check('duplicate-ids').violations).toHaveLength(1)
    expect(check('needs-cycles').label).toBeTruthy()
  })

  it('emits an all-clear JSON verdict', async () => {
    repo.writeBacklog(CLEAN)
    writeJournal(repo, 'ddd')
    const stdout = new Capture()
    expect(await lint.run([...journalArgs, '--json'], { stdout, cwd: repo.dir })).toBe(0)
    const report = JSON.parse(stdout.text)
    expect(report.ok).toBe(true)
    expect(report.itemCount).toBe(3)
    for (const c of report.checks) {
      expect(c.ok).toBe(true)
      expect(c.violations).toEqual([])
    }
  })
})
