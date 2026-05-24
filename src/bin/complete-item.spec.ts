import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { main } from './complete-item.ts'
import { claim, claimedIds } from '../lib/claims-ledger.ts'
import { capture, makeRepo } from '../mocks/test-helpers.ts'

const RICH = `# B

## Launch

### Auth

- ∆AAA Add login — short description.

### Sole epic

- ∆SOL Solo item.

## Refactors

- ∆REF A standing refactor.
`

describe('complete-item main()', () => {
  it('writes a journal entry and releases the claim', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      claim(repo.root, 'AAA')
      const code = main(['∆AAA'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      const journalDir = join(repo.root, 'docs', 'journal')
      const file = join(journalDir, '∆AAA-add-login.md')
      expect(existsSync(file)).toBe(true)
      expect(readFileSync(file, 'utf8')).toContain(
        '> - ∆AAA Add login — short description.'
      )
      expect(claimedIds(repo.root).has('AAA')).toBe(false)
      const out = sink.out.join('\n')
      expect(out).toContain('Released ∆AAA.')
      expect(out).toMatch(/Delete lines? /)
    } finally {
      repo.cleanup()
    }
  })

  it('--dry-run leaves no files, no claim release', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      claim(repo.root, 'AAA')
      const code = main(['AAA', '--dry-run'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(0)
      expect(existsSync(join(repo.root, 'docs/journal/∆AAA-add-login.md'))).toBe(false)
      expect(claimedIds(repo.root).has('AAA')).toBe(true)
      const out = sink.out.join('\n')
      expect(out).toContain('(dry run — nothing written)')
      expect(out).toContain('Would release ∆AAA.')
    } finally {
      repo.cleanup()
    }
  })

  it("reports the emptied-epic scope when the item is its epic's only child", () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['SOL', '--dry-run'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(0)
      const out = sink.out.join('\n')
      expect(out).toContain('was the only item in epic')
    } finally {
      repo.cleanup()
    }
  })

  it('reports the emptied-initiative scope (non-Refactors)', () => {
    const repo = makeRepo('## Solo initiative\n\n- ∆AAA Lone item.\n')
    const sink = capture()
    try {
      const code = main(['AAA', '--dry-run'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(0)
      const out = sink.out.join('\n')
      expect(out).toContain('was the only item in initiative')
    } finally {
      repo.cleanup()
    }
  })

  it('keeps `## Refactors` when its only item is completed', () => {
    const repo = makeRepo('## Refactors\n\n- ∆REF Lone refactor.\n')
    const sink = capture()
    try {
      const code = main(['REF', '--dry-run'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(0)
      const out = sink.out.join('\n')
      expect(out).toContain('## Refactors` is now empty but ALWAYS stays')
    } finally {
      repo.cleanup()
    }
  })

  it('reports a multi-line span when removing a wrapped item', () => {
    const repo = makeRepo(
      '## I\n\n- ∆AAA Wrapped item with\n  a continuation.\n- ∆BBB Other.\n'
    )
    const sink = capture()
    try {
      const code = main(['AAA', '--dry-run'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('Delete lines ')
    } finally {
      repo.cleanup()
    }
  })

  it('honours --slug and --title overrides', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['AAA', '--slug', 'custom-slug', '--title', 'Custom Title'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(0)
      const file = join(repo.root, 'docs/journal/∆AAA-custom-slug.md')
      expect(existsSync(file)).toBe(true)
      expect(readFileSync(file, 'utf8')).toContain('title: Custom Title')
    } finally {
      repo.cleanup()
    }
  })

  it('rejects a malformed kebab slug', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['AAA', '--slug', 'NotKebab'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('--slug must be kebab-case')
    } finally {
      repo.cleanup()
    }
  })

  it('rejects an empty title', () => {
    const repo = makeRepo('## I\n\n- ∆AAA  — only a dash-separator description.\n')
    const sink = capture()
    try {
      const code = main(['AAA'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('could not derive a title')
    } finally {
      repo.cleanup()
    }
  })

  it('rejects an unknown flag', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['--bogus'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('unknown flag: --bogus')
    } finally {
      repo.cleanup()
    }
  })

  it('rejects extra positional arguments', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['AAA', 'EXTRA'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('unexpected argument: EXTRA')
    } finally {
      repo.cleanup()
    }
  })

  it('requires an id', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('usage: complete-item.ts')
    } finally {
      repo.cleanup()
    }
  })

  it('rejects a malformed id', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['BAD-ID'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('<id> must be a 3-char task ID')
    } finally {
      repo.cleanup()
    }
  })

  it('errors when the id is not in BACKLOG.md', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['ZZZ'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('is not in BACKLOG.md')
    } finally {
      repo.cleanup()
    }
  })

  it('errors when the item sits under no initiative', () => {
    const repo = makeRepo('# B\n\n- ∆AAA Orphan item.\n')
    const sink = capture()
    try {
      const code = main(['AAA'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('sits under no `##` initiative')
    } finally {
      repo.cleanup()
    }
  })

  it('refuses to overwrite an existing journal entry', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      repo.writeJournal('∆AAA-already-done.md', '')
      const code = main(['AAA'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('already exists')
    } finally {
      repo.cleanup()
    }
  })

  it('notes when the released claim was not previously held', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['AAA'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('was not claimed — release recorded anyway')
    } finally {
      repo.cleanup()
    }
  })

  it('--dry-run notes when no claim is held', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['AAA', '--dry-run'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('not currently claimed — would be a no-op')
    } finally {
      repo.cleanup()
    }
  })

  it('handles --slug with a missing value (next-arg slurped as empty string)', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['AAA', '--slug'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('--slug must be kebab-case')
    } finally {
      repo.cleanup()
    }
  })

  it('handles --title with a missing value', () => {
    const repo = makeRepo(RICH)
    const sink = capture()
    try {
      const code = main(['AAA', '--title'], {
        cwd: repo.root,
        log: sink.log,
        err: sink.err,
      })
      expect(code).toBe(1)
      expect(sink.errs[0]).toContain('could not derive a title')
    } finally {
      repo.cleanup()
    }
  })
})
