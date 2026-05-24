import { describe, expect, it } from 'vitest'

import { main } from './report-status.ts'
import { claim } from '../lib/claims-ledger.ts'
import { capture, makeRepo } from '../mocks/test-helpers.ts'

const RICH_BACKLOG = `# B

## Launch

### Auth

- ∆AAA Eligible.
- ∆BBB Blocked; needs: ∆AAA
- ∆CCC In-flight already.

## Refactors

- ∆REF A standing refactor.
`

describe('report-status main()', () => {
  it('renders the human-readable report', () => {
    const repo = makeRepo(RICH_BACKLOG)
    const sink = capture()
    try {
      claim(repo.root, 'CCC')
      repo.writeJournal('∆ZZZ-old.md', '')
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      const text = sink.out.join('\n')
      expect(text).toContain('BACKLOG STATUS — 4 open item(s)')
      expect(text).toContain('1 completed (docs/journal/)')
      expect(text).toContain('PROGRESS BY INITIATIVE')
      expect(text).toContain('ELIGIBLE NOW — 2 task(s) free to plan')
      expect(text).toContain('CRITICAL PATH TO NEXT MILESTONE — Launch')
      expect(text).toContain('Deepest needs: chain is 2 levels')
    } finally {
      repo.cleanup()
    }
  })

  it('emits JSON with --json', () => {
    const repo = makeRepo(RICH_BACKLOG)
    const sink = capture()
    try {
      claim(repo.root, 'CCC')
      const code = main(['--json'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      const data = JSON.parse(sink.out[0])
      expect(data.openItems).toBe(4)
      expect(data.nextMilestone).toBe('Launch')
      const launch = data.initiatives.find((i: { name: string }) => i.name === 'Launch')
      expect(launch.eligible).toEqual(['AAA'])
      expect(launch.blocked).toEqual(['BBB'])
      expect(launch.inFlight).toEqual(['CCC'])
    } finally {
      repo.cleanup()
    }
  })

  it('says "no open items" when BACKLOG.md is empty', () => {
    const repo = makeRepo('# B\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('CRITICAL PATH — no open items.')
    } finally {
      repo.cleanup()
    }
  })

  it('reports nextMilestone: null in JSON when no initiative has open items', () => {
    const repo = makeRepo('# B\n')
    const sink = capture()
    try {
      const code = main(['--json'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(JSON.parse(sink.out[0]).nextMilestone).toBeNull()
    } finally {
      repo.cleanup()
    }
  })

  it('skips initiatives with no eligible items in the ELIGIBLE NOW grouping', () => {
    const repo = makeRepo(
      `## Launch

- ∆AAA First; needs: ∆BBB
- ∆BBB Second; needs: ∆AAA

## Refactors

- ∆REF Standing refactor.
`
    )
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      const text = sink.out.join('\n')
      // Launch has zero eligible items; the grouping should skip its row entirely.
      const eligibleSection = text.split('ELIGIBLE NOW')[1].split('CRITICAL PATH')[0]
      expect(eligibleSection).not.toContain('Launch')
      expect(eligibleSection).toContain('∆REF')
    } finally {
      repo.cleanup()
    }
  })

  it('falls back to the first initiative when only Refactors exists', () => {
    const repo = makeRepo('## Refactors\n\n- ∆REF Standing item.\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('CRITICAL PATH TO NEXT MILESTONE — Refactors')
    } finally {
      repo.cleanup()
    }
  })

  it('reports a cycle when the next-milestone path has repeated ids', () => {
    const repo = makeRepo(
      '## Launch\n\n- ∆AAA First; needs: ∆BBB\n- ∆BBB Second; needs: ∆AAA\n'
    )
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain(
        'This milestone has a needs: cycle, so its critical path cannot be'
      )
    } finally {
      repo.cleanup()
    }
  })

  it('handles an item that sits under no initiative', () => {
    const repo = makeRepo('# B\n\n- ∆AAA Orphan item.\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('(no initiative)')
    } finally {
      repo.cleanup()
    }
  })

  it('handles an initiative whose critical path is a single item', () => {
    const repo = makeRepo('## I\n\n- ∆AAA Lone item.\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('Deepest needs: chain is 1 level')
    } finally {
      repo.cleanup()
    }
  })

  it('lists "none eligible" when every task is blocked', () => {
    const repo = makeRepo('## I\n\n- ∆AAA First; needs: ∆BBB\n- ∆BBB Second; needs: ∆AAA\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain(
        '(none — every open task is blocked or in-flight)'
      )
    } finally {
      repo.cleanup()
    }
  })
})
