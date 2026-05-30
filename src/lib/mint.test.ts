import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { mint, randomId, takenIds } from './mint.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

describe('takenIds', () => {
  const repo = useTempRepo('delto-mint-')

  it('collects every ∆ id from BACKLOG.md and the journal dir', () => {
    repo.writeBacklog('- ∆abc item one; needs: ∆def\n- ∆ghi item two\n')
    const journal = repo.path('journal')
    mkdirSync(journal)
    writeFileSync(join(journal, '∆xyz-done.md'), '---\nid: ∆xyz\n---\nrefs ∆abc\n')
    expect([...takenIds(repo.path('BACKLOG.md'), journal)].sort()).toEqual([
      'abc',
      'def',
      'ghi',
      'xyz',
    ])
  })

  it('skips non-file journal entries and tolerates an absent journal dir', () => {
    repo.writeBacklog('- ∆abc x\n')
    const journal = repo.path('journal')
    mkdirSync(journal)
    mkdirSync(join(journal, 'subdir'))
    expect([...takenIds(repo.path('BACKLOG.md'), journal)]).toEqual(['abc'])
    expect([...takenIds(repo.path('BACKLOG.md'), repo.path('does-not-exist'))]).toEqual([
      'abc',
    ])
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
