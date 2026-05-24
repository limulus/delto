import { describe, expect, it } from 'vitest'

import { main } from './find-eligible-tasks.ts'
import { claim, claimedIds } from '../lib/claims-ledger.ts'
import { capture, makeRepo } from '../mocks/test-helpers.ts'

const BACKLOG = `# B

## Launch

### Epic

- ∆AAA Eligible item.
- ∆BBB Blocked item; needs: ∆AAA
- ∆CCC Conflicting item; touches: ∆DDD
- ∆DDD In-flight peer.
- ∆EEE Already in-flight.
`

describe('find-eligible-tasks main()', () => {
  it('prints a human-readable list by default', () => {
    const repo = makeRepo(BACKLOG)
    const sink = capture()
    try {
      claim(repo.root, 'DDD')
      claim(repo.root, 'EEE')
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      const text = sink.out.join('\n')
      expect(text).toContain('ELIGIBLE — 1 of 5')
      expect(text).toContain('∆AAA')
      expect(text).toContain('4 other task(s) are claimed')
    } finally {
      repo.cleanup()
    }
  })

  it('shows the "none eligible" placeholder when no task is free', () => {
    const repo = makeRepo('## I\n\n- ∆AAA First; needs: ∆BBB\n- ∆BBB Second; needs: ∆AAA\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('(none — every backlog task is')
    } finally {
      repo.cleanup()
    }
  })

  it('emits JSON when --json is passed', () => {
    const repo = makeRepo(BACKLOG)
    const sink = capture()
    try {
      claim(repo.root, 'DDD')
      claim(repo.root, 'EEE')
      const code = main(['--json'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      const data = JSON.parse(sink.out[0])
      expect(data.eligible.map((e: { id: string }) => e.id)).toEqual(['AAA'])
      expect(data.claimed.sort()).toEqual(['DDD', 'EEE'])
      expect(data.excluded.find((e: { id: string }) => e.id === 'BBB').reason).toContain(
        'needs ∆AAA'
      )
      expect(data.excluded.find((e: { id: string }) => e.id === 'CCC').reason).toContain(
        'shares files'
      )
    } finally {
      repo.cleanup()
    }
  })

  it('records a --claim and prints what happened', () => {
    const repo = makeRepo(BACKLOG)
    const sink = capture()
    try {
      const code = main(['--claim', 'AAA'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(0)
      expect(claimedIds(repo.root).has('AAA')).toBe(true)
      expect(sink.out[0]).toContain('Claimed ∆AAA')
    } finally {
      repo.cleanup()
    }
  })

  it('records a --release and prints what happened', () => {
    const repo = makeRepo(BACKLOG)
    const sink = capture()
    try {
      claim(repo.root, 'AAA')
      const code = main(['--release', '∆AAA'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(0)
      expect(claimedIds(repo.root).has('AAA')).toBe(false)
      expect(sink.out[0]).toContain('Released ∆AAA')
    } finally {
      repo.cleanup()
    }
  })

  it('rejects --claim and --release together as mutually exclusive', () => {
    const repo = makeRepo('## I\n\n- ∆AAA First.\n')
    const sink = capture()
    try {
      const code = main(['--claim', 'AAA', '--release', 'BBB'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('mutually exclusive')
    } finally {
      repo.cleanup()
    }
  })

  it('rejects a malformed --claim id', () => {
    const repo = makeRepo(BACKLOG)
    const sink = capture()
    try {
      const code = main(['--claim', 'bad-id'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('--claim needs a 3-char task ID')
    } finally {
      repo.cleanup()
    }
  })

  it('rejects a malformed --release id', () => {
    const repo = makeRepo(BACKLOG)
    const sink = capture()
    try {
      const code = main(['--release', 'oops'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('--release needs a 3-char task ID')
    } finally {
      repo.cleanup()
    }
  })

  it('omits the →N suffix when no other item depends on the eligible task', () => {
    const repo = makeRepo('## I\n\n- ∆AAA No dependents anywhere.\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      const text = sink.out.join('\n')
      expect(text).toContain('∆AAA')
      expect(text).not.toContain('∆AAA→')
    } finally {
      repo.cleanup()
    }
  })

  it('omits unblocks in JSON when no other item depends on the eligible task', () => {
    const repo = makeRepo('## I\n\n- ∆AAA No dependents.\n')
    const sink = capture()
    try {
      const code = main(['--json'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      const data = JSON.parse(sink.out[0])
      expect(data.eligible[0].unblocks).toEqual([])
    } finally {
      repo.cleanup()
    }
  })

  it('treats a --claim with no following arg as an empty id and errors', () => {
    const repo = makeRepo('## I\n\n- ∆AAA First.\n')
    const sink = capture()
    try {
      const code = main(['--claim'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('--claim needs a 3-char task ID')
    } finally {
      repo.cleanup()
    }
  })

  it('annotates eligible items whose ids are needed by others', () => {
    const repo = makeRepo(
      `## I

- ∆AAA Prerequisite.
- ∆BBB Depends on AAA; needs: ∆AAA
- ∆CCC Also depends on AAA; needs: ∆AAA
`
    )
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('∆AAA→2')
    } finally {
      repo.cleanup()
    }
  })
})
