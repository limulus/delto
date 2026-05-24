import { mkdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { main, mint, randomId as randomIdImport, takenIds } from './mint-id.ts'
import { capture, makeRepo } from '../mocks/test-helpers.ts'

describe('mint-id main()', () => {
  it('prints one fresh ∆xxx by default', () => {
    const repo = makeRepo('## I\n\n- ∆AAA Existing item.\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out).toHaveLength(1)
      expect(sink.out[0]).toMatch(/^∆[A-Za-z0-9]{3}$/)
      expect(sink.out[0]).not.toBe('∆AAA')
    } finally {
      repo.cleanup()
    }
  })

  it('mints --count distinct ids', () => {
    const repo = makeRepo()
    const sink = capture()
    try {
      const code = main(['--count', '5'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out).toHaveLength(5)
      expect(new Set(sink.out).size).toBe(5)
    } finally {
      repo.cleanup()
    }
  })

  it('rejects an invalid --count', () => {
    const repo = makeRepo()
    const sink = capture()
    try {
      const code = main(['--count', 'banana'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('--count needs a positive integer')
    } finally {
      repo.cleanup()
    }
  })

  it('avoids ids already present in docs/journal/', () => {
    const taken = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const s = i.toString(36).padStart(3, 'A').slice(-3)
      taken.add(s)
    }
    const ids = mint(3, taken)
    expect(ids.length).toBe(3)
    for (const id of ids) expect(taken.has(id)).toBe(false)
  })

  it('takenIds scans BACKLOG.md and docs/journal/', () => {
    const repo = makeRepo('# B\n\n- ∆AAA in backlog.\n')
    try {
      repo.writeJournal('∆BBB-done.md', '---\nid: ∆BBB\n---\n\nMentions ∆CCC.\n')
      const ids = takenIds(repo.root)
      expect(ids.has('AAA')).toBe(true)
      expect(ids.has('BBB')).toBe(true)
      expect(ids.has('CCC')).toBe(true)
    } finally {
      repo.cleanup()
    }
  })

  it('handles a missing docs/journal/ directory gracefully', () => {
    const repo = makeRepo('# B\n\n- ∆AAA only one.\n')
    try {
      const ids = takenIds(repo.root)
      expect(ids.has('AAA')).toBe(true)
      expect(ids.size).toBe(1)
    } finally {
      repo.cleanup()
    }
  })

  it('skips non-file entries in docs/journal/', () => {
    const repo = makeRepo('# B\n')
    try {
      repo.writeJournal('∆BBB-done.md', 'mentions ∆BBB inside body')
      mkdirSync(`${repo.root}/docs/journal/subdir`, { recursive: true })
      const ids = takenIds(repo.root)
      expect(ids.has('BBB')).toBe(true)
    } finally {
      repo.cleanup()
    }
  })

  it('loops past a collision in the taken set', () => {
    const taken = new Set(['AAA'])
    // First two guesses collide; the third is fresh — exercises the `continue`.
    const queue = ['AAA', 'AAA', 'BBB']
    const ids = mint(1, taken, () => queue.shift()!)
    expect(ids).toEqual(['BBB'])
  })

  it('randomId draws a 3-char body from the BACKLOG.md alphabet', () => {
    // Re-imported to cover the default randomInt-driven path that the injectable
    // `mint(count, taken, next)` would otherwise bypass in unit tests.
    const id = randomIdImport()
    expect(id).toMatch(/^[A-Za-z0-9]{3}$/)
  })
})
