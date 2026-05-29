import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ID, findRepoRoot } from './backlog.ts'

describe('findRepoRoot', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'delto-backlog-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns the directory that holds BACKLOG.md', () => {
    writeFileSync(join(dir, 'BACKLOG.md'), '# Backlog\n')
    expect(findRepoRoot(dir)).toBe(dir)
  })

  it('walks up to an ancestor BACKLOG.md', () => {
    writeFileSync(join(dir, 'BACKLOG.md'), '# Backlog\n')
    const nested = join(dir, 'packages', 'foo')
    mkdirSync(nested, { recursive: true })
    expect(findRepoRoot(nested)).toBe(dir)
  })

  it('returns the nearest BACKLOG.md when several exist (monorepo: nearest wins)', () => {
    writeFileSync(join(dir, 'BACKLOG.md'), '# root\n')
    const pkg = join(dir, 'packages', 'foo')
    mkdirSync(pkg, { recursive: true })
    writeFileSync(join(pkg, 'BACKLOG.md'), '# foo\n')
    expect(findRepoRoot(pkg)).toBe(pkg)
  })

  it('returns undefined when no BACKLOG.md exists in any parent', () => {
    expect(findRepoRoot(dir)).toBeUndefined()
  })
})

describe('ID', () => {
  it('matches a 3-char alphanumeric deltoid body and nothing else', () => {
    const re = new RegExp(`^${ID}$`)
    expect(re.test('a9Z')).toBe(true)
    expect(re.test('ab')).toBe(false)
    expect(re.test('abcd')).toBe(false)
    expect(re.test('ab-')).toBe(false)
  })
})
