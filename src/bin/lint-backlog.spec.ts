import { describe, expect, it } from 'vitest'

import { main } from './lint-backlog.ts'
import { capture, makeRepo } from '../mocks/test-helpers.ts'

describe('lint-backlog main()', () => {
  it('reports a clean backlog with exit 0', () => {
    const repo = makeRepo('## I\n\n- ∆AAA Plain item.\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(0)
      expect(sink.out.join('\n')).toContain('clean: all 5 integrity checks pass')
    } finally {
      repo.cleanup()
    }
  })

  it('flags duplicate ids within BACKLOG.md', () => {
    const repo = makeRepo('## I\n\n- ∆AAA First.\n- ∆AAA Duplicate.\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.out.join('\n')).toContain('∆AAA is used by 2 items')
    } finally {
      repo.cleanup()
    }
  })

  it('flags an id that collides with a completed journal entry', () => {
    const repo = makeRepo('## I\n\n- ∆AAA Live.\n')
    const sink = capture()
    try {
      repo.writeJournal('∆AAA-old.md', '')
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.out.join('\n')).toContain('reuses the ID of a completed item')
    } finally {
      repo.cleanup()
    }
  })

  it('flags an unresolved needs:/touches: ref', () => {
    const repo = makeRepo(
      '## I\n\n- ∆AAA First; needs: ∆ZZZ\n- ∆BBB Second; touches: ∆QQQ\n'
    )
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      const text = sink.out.join('\n')
      expect(text).toContain('needs: ∆ZZZ, which is neither a live nor a completed item')
      expect(text).toContain('touches: ∆QQQ, which is neither a live nor a completed item')
    } finally {
      repo.cleanup()
    }
  })

  it('flags a needs: cycle', () => {
    const repo = makeRepo(
      '## I\n\n- ∆AAA needs B; needs: ∆BBB\n- ∆BBB needs A; needs: ∆AAA\n'
    )
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.out.join('\n')).toMatch(/needs: dependency cycles[\s\S]*∆[AB]+/)
    } finally {
      repo.cleanup()
    }
  })

  it('flags an asymmetric touches: edge', () => {
    const repo = makeRepo('## I\n\n- ∆AAA Lists B; touches: ∆BBB\n- ∆BBB Misses A.\n')
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.out.join('\n')).toContain('but ∆BBB omits ∆AAA')
    } finally {
      repo.cleanup()
    }
  })

  it('ignores touches: that targets a shipped item (no live peer to be asymmetric with)', () => {
    const repo = makeRepo('## I\n\n- ∆AAA Touches a shipped item; touches: ∆DON\n')
    const sink = capture()
    try {
      repo.writeJournal('∆DON-old.md', '')
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      // ∆DON resolves to a journal entry — known — so unresolved-refs is clean. The
      // touches-asymmetry check skips it because ∆DON is not a live backlog item.
      expect(code).toBe(0)
    } finally {
      repo.cleanup()
    }
  })

  it('flags an oversized item', () => {
    const repo = makeRepo(
      `## I

- ∆AAA Line one
  line two
  line three
  line four
  line five
  line six
`
    )
    const sink = capture()
    try {
      const code = main([], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      expect(sink.out.join('\n')).toContain('spans 6 lines (max 5)')
    } finally {
      repo.cleanup()
    }
  })

  it('emits JSON with --json', () => {
    const repo = makeRepo('## I\n\n- ∆AAA Plain.\n- ∆AAA Duplicate.\n')
    const sink = capture()
    try {
      const code = main(['--json'], { cwd: repo.root, log: sink.log, err: sink.err })
      expect(code).toBe(1)
      const data = JSON.parse(sink.out[0])
      expect(data.ok).toBe(false)
      expect(data.itemCount).toBe(2)
      expect(data.checks.find((c: { key: string }) => c.key === 'duplicate-ids').ok).toBe(
        false
      )
    } finally {
      repo.cleanup()
    }
  })
})
