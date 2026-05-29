import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { claim, claimedIds, claimsFile, release } from './claims-ledger.ts'

describe('claims ledger', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'delto-claims-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('claim records an id that claimedIds then reports', () => {
    claim(dir, 'abc')
    expect(claimedIds(dir).has('abc')).toBe(true)
  })

  it('creates the ledger file beside the repo root on first claim', () => {
    expect(existsSync(claimsFile(dir))).toBe(false)
    claim(dir, 'abc')
    expect(existsSync(claimsFile(dir))).toBe(true)
  })

  it('release withdraws a prior claim — last record per id wins', () => {
    claim(dir, 'abc')
    claim(dir, 'def')
    release(dir, 'abc')
    const ids = claimedIds(dir)
    expect(ids.has('abc')).toBe(false)
    expect(ids.has('def')).toBe(true)
  })

  it('returns an empty set when no ledger file exists', () => {
    expect(claimedIds(dir).size).toBe(0)
  })

  it('skips blank lines, malformed JSON, and records without a string id', () => {
    writeFileSync(
      claimsFile(dir),
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
    expect([...claimedIds(dir)]).toEqual(['abc'])
  })
})
