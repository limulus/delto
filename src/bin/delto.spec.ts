import { describe, expect, it } from 'vitest'

import { main, readVersion } from './delto.ts'
import { capture, makeRepo } from '../mocks/test-helpers.ts'

describe('delto dispatcher', () => {
  it('routes `mint` to the mint command', () => {
    const repo = makeRepo()
    const sink = capture()
    try {
      const code = main(['mint'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out[0]).toMatch(/^∆[A-Za-z0-9]{3}$/)
    } finally {
      repo.cleanup()
    }
  })

  it('routes `add` to the same mint command', () => {
    const repo = makeRepo()
    const sink = capture()
    try {
      const code = main(['add'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out[0]).toMatch(/^∆[A-Za-z0-9]{3}$/)
    } finally {
      repo.cleanup()
    }
  })

  it('routes `status` to the status report', () => {
    const repo = makeRepo('# B\n')
    const sink = capture()
    try {
      const code = main(['status'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('BACKLOG STATUS')
    } finally {
      repo.cleanup()
    }
  })

  it('routes `plan` to the eligibility report', () => {
    const repo = makeRepo('# B\n')
    const sink = capture()
    try {
      const code = main(['plan'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('ELIGIBLE — 0 of 0')
    } finally {
      repo.cleanup()
    }
  })

  it('routes `refine` and `lint` to lint-backlog', () => {
    const repo = makeRepo('## I\n\n- ∆AAA First.\n')
    const sink = capture()
    try {
      const code = main(['refine'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('integrity checks pass')
    } finally {
      repo.cleanup()
    }
    const sink2 = capture()
    const repo2 = makeRepo('## I\n\n- ∆AAA First.\n')
    try {
      const code = main(['lint'], { cwd: repo2.root, log: sink2.log, err: sink2.err })
      expect(code).toBe(0)
      expect(sink2.out.join('\n')).toContain('integrity checks pass')
    } finally {
      repo2.cleanup()
    }
  })

  it('routes `complete` to complete-item (here exercising its dry-run path)', () => {
    const repo = makeRepo('## I\n\n- ∆AAA Solo item.\n')
    const sink = capture()
    try {
      const code = main(['complete', 'AAA', '--dry-run'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('complete-backlog-item — ∆AAA')
    } finally {
      repo.cleanup()
    }
  })

  it('prints usage with `help` (exit 0)', () => {
    const sink = capture()
    const code = main(['help'], { log: sink.log, err: sink.err })
    expect(code).toBe(0)
    expect(sink.out.join('\n')).toContain('Usage: delto <command>')
  })

  it('prints usage when called with no command (exit 1)', () => {
    const sink = capture()
    const code = main([], { log: sink.log, err: sink.err })
    expect(code).toBe(1)
    expect(sink.out.join('\n')).toContain('Usage: delto <command>')
  })

  it('handles --help', () => {
    const sink = capture()
    const code = main(['--help'], { log: sink.log, err: sink.err })
    expect(code).toBe(0)
    expect(sink.out.join('\n')).toContain('Usage: delto')
  })

  it('handles -h', () => {
    const sink = capture()
    const code = main(['-h'], { log: sink.log, err: sink.err })
    expect(code).toBe(0)
    expect(sink.out.join('\n')).toContain('Usage: delto')
  })

  it('prints the package version with --version', () => {
    const sink = capture()
    const code = main(['--version'], { log: sink.log, err: sink.err })
    expect(code).toBe(0)
    expect(sink.out[0]).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('prints the package version with -v', () => {
    const sink = capture()
    const code = main(['-v'], { log: sink.log, err: sink.err })
    expect(code).toBe(0)
    expect(sink.out[0]).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('reports RepoRootNotFoundError with a friendly message instead of a stack trace', () => {
    const sink = capture()
    const code = main(['status'], {
      cwd: '/nonexistent-delto-test-root',
      log: sink.log,
      err: sink.err,
    })
    expect(code).toBe(1)
    expect(sink.errs[0]).toContain('delto: no BACKLOG.md found in')
  })

  it('rethrows non-RepoRootNotFoundError errors from a subcommand', () => {
    const sink = capture()
    const commands = [
      {
        names: ['boom'],
        summary: 'throws for testing',
        run: () => {
          throw new Error('boom')
        },
      },
    ]
    expect(() => main(['boom'], { commands, log: sink.log, err: sink.err })).toThrow('boom')
  })

  it('errors on an unknown command and prints usage on stderr', () => {
    const sink = capture()
    const code = main(['bogus'], { log: sink.log, err: sink.err })
    expect(code).toBe(1)
    expect(sink.errs.join('\n')).toContain('unknown command "bogus"')
    expect(sink.errs.join('\n')).toContain('Usage: delto')
  })
})

describe('readVersion', () => {
  it('returns the package version from package.json', () => {
    expect(readVersion()).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('returns "unknown" when no matching package.json is reachable', () => {
    expect(readVersion('/')).toBe('unknown')
  })

  it('walks past package.json files whose name does not match @limulus/delto', () => {
    // node_modules typically holds many package.json files under transitive
    // dependencies — none of them name themselves @limulus/delto, so the search
    // walks past them to keep climbing.
    const startInDep = `${process.cwd()}/node_modules/vitest`
    expect(readVersion(startInDep)).toMatch(/^\d+\.\d+\.\d+/)
  })
})
