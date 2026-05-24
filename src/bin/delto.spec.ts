import { describe, expect, it } from 'vitest'

import { main, readVersion } from './delto.ts'
import { type MainOpts } from './main.ts'
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

  it('prints usage on stderr when called with no command (exit 1)', () => {
    const sink = capture()
    const code = main([], { log: sink.log, err: sink.err })
    expect(code).toBe(1)
    expect(sink.errs.join('\n')).toContain('Usage: delto <command>')
    expect(sink.out).toEqual([])
  })

  it('handles --help anywhere in argv (delto --help mint, delto mint --help)', () => {
    for (const argv of [
      ['--help', 'mint'],
      ['mint', '--help'],
      ['plan', '-h'],
    ]) {
      const sink = capture()
      const code = main(argv, { log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('Usage: delto')
    }
  })

  it('handles --version anywhere in argv (delto -v plan, delto status --version)', () => {
    for (const argv of [
      ['-v', 'plan'],
      ['status', '--version'],
    ]) {
      const sink = capture()
      const code = main(argv, { log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out[0]).toMatch(/^\d+\.\d+\.\d+/)
    }
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

  it('frames an Error thrown from a subcommand with `delto <cmd>: <message>`', () => {
    const sink = capture()
    const commands = [
      {
        names: ['boom'],
        summary: 'throws for testing',
        run: () => {
          throw new Error('boom went off')
        },
      },
    ]
    const code = main(['boom'], { commands, log: sink.log, err: sink.err })
    expect(code).toBe(1)
    expect(sink.errs[0]).toBe('delto boom: boom went off')
  })

  it('rethrows non-Error throws (defensive — should never happen in practice)', () => {
    const sink = capture()
    const bareString: unknown = 'a bare string'
    const commands = [
      {
        names: ['boom'],
        summary: 'throws for testing',
        run: (): number => {
          throw bareString
        },
      },
    ]
    expect(() => main(['boom'], { commands, log: sink.log, err: sink.err })).toThrow(
      'a bare string'
    )
  })

  it('strips the dispatcher-only `commands` field before invoking a subcommand', () => {
    let seen: MainOpts | null = null
    const commands = [
      {
        names: ['probe'],
        summary: 'probe what its opts look like',
        run: (_argv: string[], opts: MainOpts): number => {
          seen = opts
          return 0
        },
      },
    ]
    main(['probe'], { commands, log: () => {}, err: () => {} })
    expect(seen).not.toBeNull()
    const opts = seen as unknown as MainOpts & { commands?: unknown }
    expect(opts.commands).toBeUndefined()
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

  it('skips a malformed ancestor package.json without crashing', async () => {
    const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const dir = mkdtempSync(join(tmpdir(), 'delto-readversion-'))
    try {
      writeFileSync(join(dir, 'package.json'), '{ this is not json')
      // With no @limulus/delto package.json reachable from this dir, the walk
      // returns 'unknown'. The malformed file is skipped via try/catch.
      expect(readVersion(dir)).toBe('unknown')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
