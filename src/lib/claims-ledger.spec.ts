import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { describe, expect, it } from 'vitest'

import { appendLedger, claim, claimedIds, claimsFile, release } from './claims-ledger.ts'
import { makeRepo } from '../mocks/test-helpers.ts'

describe('claimsFile', () => {
  it('points at the per-repo append-only ledger', () => {
    const repo = makeRepo()
    try {
      expect(claimsFile(repo.root)).toBe(
        `${repo.root}/.claude/skills/plan-backlog-item/claims.local.jsonl`
      )
    } finally {
      repo.cleanup()
    }
  })
})

describe('claimedIds', () => {
  it('returns an empty set when no ledger exists', () => {
    const repo = makeRepo()
    try {
      expect(claimedIds(repo.root).size).toBe(0)
    } finally {
      repo.cleanup()
    }
  })

  it('treats the last record per id as authoritative', () => {
    const repo = makeRepo()
    try {
      claim(repo.root, 'AAA')
      claim(repo.root, 'BBB')
      release(repo.root, 'AAA')
      const ids = claimedIds(repo.root)
      expect(ids.has('AAA')).toBe(false)
      expect(ids.has('BBB')).toBe(true)
    } finally {
      repo.cleanup()
    }
  })

  it('skips malformed lines and records without a string id', () => {
    const repo = makeRepo()
    try {
      const file = claimsFile(repo.root)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(
        file,
        [
          '{"id":"AAA"}',
          'not-json',
          '{"id":42}',
          '',
          '   ',
          '{"id":"BBB","released":true}',
        ].join('\n') + '\n'
      )
      const ids = claimedIds(repo.root)
      expect(ids.has('AAA')).toBe(true)
      expect(ids.has('BBB')).toBe(false)
    } finally {
      repo.cleanup()
    }
  })
})

describe('appendLedger', () => {
  it('writes arbitrary records as JSONL', () => {
    const repo = makeRepo()
    try {
      appendLedger(repo.root, { id: 'AAA', note: 'hello' })
      const ids = claimedIds(repo.root)
      expect(ids.has('AAA')).toBe(true)
    } finally {
      repo.cleanup()
    }
  })
})
