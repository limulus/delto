import { describe, expect, it } from 'vitest'

import * as delto from './index.ts'

describe('public exports', () => {
  it('re-exports the parser, ledger, and eligibility surface', () => {
    expect(typeof delto.parseBacklog).toBe('function')
    expect(typeof delto.findRepoRoot).toBe('function')
    expect(typeof delto.journalIds).toBe('function')
    expect(typeof delto.suffixIds).toBe('function')
    expect(typeof delto.claim).toBe('function')
    expect(typeof delto.release).toBe('function')
    expect(typeof delto.claimedIds).toBe('function')
    expect(typeof delto.claimsFile).toBe('function')
    expect(typeof delto.appendLedger).toBe('function')
    expect(typeof delto.computeEligibility).toBe('function')
    expect(typeof delto.RepoRootNotFoundError).toBe('function')
    expect(delto.ID).toBe('[A-Za-z0-9]{3}')
  })
})
