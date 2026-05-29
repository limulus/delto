import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { mint, randomId, takenIds } from './mint.ts'

describe('takenIds', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'delto-mint-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('collects every ∆ id from BACKLOG.md and the journal dir', () => {
    const backlog = join(dir, 'BACKLOG.md')
    writeFileSync(backlog, '- ∆abc item one; needs: ∆def\n- ∆ghi item two\n')
    const journal = join(dir, 'journal')
    mkdirSync(journal)
    writeFileSync(join(journal, '∆xyz-done.md'), '---\nid: ∆xyz\n---\nrefs ∆abc\n')
    expect([...takenIds(backlog, journal)].sort()).toEqual(['abc', 'def', 'ghi', 'xyz'])
  })

  it('skips non-file journal entries and tolerates an absent journal dir', () => {
    const backlog = join(dir, 'BACKLOG.md')
    writeFileSync(backlog, '- ∆abc x\n')
    const journal = join(dir, 'journal')
    mkdirSync(journal)
    mkdirSync(join(journal, 'subdir'))
    expect([...takenIds(backlog, journal)]).toEqual(['abc'])
    expect([...takenIds(backlog, join(dir, 'does-not-exist'))]).toEqual(['abc'])
  })
})

describe('randomId', () => {
  it('returns a 3-char id drawn from the 62-char alphabet', () => {
    for (let i = 0; i < 200; i++) {
      expect(randomId()).toMatch(/^[A-Za-z0-9]{3}$/)
    }
  })
})

describe('mint', () => {
  it('mints the requested count of fresh, mutually-distinct ids', () => {
    const ids = mint(5, new Set())
    expect(ids).toHaveLength(5)
    expect(new Set(ids).size).toBe(5)
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9]{3}$/)
  })

  it('never mints an id that is already taken', () => {
    const taken = new Set(['abc', 'def'])
    for (const id of mint(20, taken)) expect(taken.has(id)).toBe(false)
  })

  it('retries past a collision — with a taken id or one just minted', () => {
    const seq = ['abc', 'xyz', 'xyz', 'def']
    let i = 0
    const ids = mint(2, new Set(['abc']), () => seq[i++])
    expect(ids).toEqual(['xyz', 'def'])
  })
})
