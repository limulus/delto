import { mkdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { requireDeltoid, requireRepoRoot } from './preconditions.ts'
import { Capture } from '../mocks/capture.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

describe('requireRepoRoot', () => {
  const repo = useTempRepo('delto-precond-')

  it('returns the repo root and writes nothing when dir is inside a repo', () => {
    repo.writeBacklog('# Backlog\n')
    const nested = repo.path('packages', 'foo')
    mkdirSync(nested, { recursive: true })
    const stderr = new Capture()
    expect(requireRepoRoot(nested, stderr, 'surface')).toBe(repo.dir)
    expect(stderr.text).toBe('')
  })

  it('returns null and writes the standard error when no BACKLOG.md ancestor exists', () => {
    const stderr = new Capture()
    expect(requireRepoRoot(repo.dir, stderr, 'mint')).toBeNull()
    expect(stderr.text).toBe(
      'delto mint: no BACKLOG.md found in the current directory or any parent.\n'
    )
  })
})

describe('requireDeltoid', () => {
  it('returns the body and writes nothing for a valid id', () => {
    const stderr = new Capture()
    expect(requireDeltoid('a9Z', stderr, 'complete')).toBe('a9Z')
    expect(stderr.text).toBe('')
  })

  it('strips a leading ∆ sigil and returns the body', () => {
    const stderr = new Capture()
    expect(requireDeltoid('∆abc', stderr, 'claim')).toBe('abc')
    expect(stderr.text).toBe('')
  })

  it('returns null and writes the standard error for invalid input', () => {
    const stderr = new Capture()
    expect(requireDeltoid('nope', stderr, 'release')).toBeNull()
    expect(stderr.text).toBe(
      "delto release: 'nope' is not a valid deltoid (∆ followed by 3 alphanumerics).\n"
    )
  })
})
