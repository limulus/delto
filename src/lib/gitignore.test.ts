import { describe, expect, it } from 'vitest'

import { ensureClaimLedgerIgnored } from './gitignore.ts'

const COMMENT = '# Delto plan-backlog-item claim ledger (sits alongside BACKLOG.md)'
const BLOCK = `${COMMENT}\n.delto-claims.local.jsonl\n`

describe('ensureClaimLedgerIgnored', () => {
  it('produces a fresh file when none exists', () => {
    expect(ensureClaimLedgerIgnored(undefined)).toBe(BLOCK)
  })

  it('appends after a blank line to content ending in a newline', () => {
    expect(ensureClaimLedgerIgnored('node_modules/\n')).toBe(`node_modules/\n\n${BLOCK}`)
  })

  it('repairs a missing trailing newline before appending', () => {
    expect(ensureClaimLedgerIgnored('node_modules/')).toBe(`node_modules/\n\n${BLOCK}`)
  })

  it('returns null when the ledger pattern is already present', () => {
    expect(ensureClaimLedgerIgnored('.delto-claims.local.jsonl\n')).toBeNull()
  })

  it('still appends when the pattern only appears inside another line', () => {
    const existing = 'foo.delto-claims.local.jsonl.bak\n'
    expect(ensureClaimLedgerIgnored(existing)).toBe(`${existing}\n${BLOCK}`)
  })

  it('treats an empty existing file like a fresh one', () => {
    expect(ensureClaimLedgerIgnored('')).toBe(BLOCK)
  })

  it('detects the pattern across CRLF line endings', () => {
    expect(
      ensureClaimLedgerIgnored('node_modules/\r\n.delto-claims.local.jsonl\r\n')
    ).toBeNull()
  })
})
