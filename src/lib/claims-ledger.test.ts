import { existsSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { claim, claimedIds, claimsFile, release } from './claims-ledger.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

describe('claims ledger', () => {
  const repo = useTempRepo('delto-claims-')

  it('claim records an id that claimedIds then reports', () => {
    claim(repo.dir, 'abc')
    expect(claimedIds(repo.dir).has('abc')).toBe(true)
  })

  it('creates the ledger file beside the repo root on first claim', () => {
    expect(existsSync(claimsFile(repo.dir))).toBe(false)
    claim(repo.dir, 'abc')
    expect(existsSync(claimsFile(repo.dir))).toBe(true)
  })

  it('release withdraws a prior claim — last record per id wins', () => {
    claim(repo.dir, 'abc')
    claim(repo.dir, 'def')
    release(repo.dir, 'abc')
    const ids = claimedIds(repo.dir)
    expect(ids.has('abc')).toBe(false)
    expect(ids.has('def')).toBe(true)
  })

  it('returns an empty set when no ledger file exists', () => {
    expect(claimedIds(repo.dir).size).toBe(0)
  })

  it('skips blank lines, malformed JSON, and records without a string id', () => {
    writeFileSync(
      claimsFile(repo.dir),
      [
        '',
        '   ',
        'not json at all',
        '{"id":123}',
        '{"released":true}',
        '{"id":"abc"}',
        '{"id":"xyz"}',
        '{"id":"xyz","released":true}',
      ].join('\n') + '\n'
    )
    expect([...claimedIds(repo.dir)]).toEqual(['abc'])
  })
})
