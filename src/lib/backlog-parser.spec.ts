import { mkdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  RepoRootNotFoundError,
  findRepoRoot,
  journalIds,
  parseBacklog,
  suffixIds,
} from './backlog-parser.ts'
import { makeRepo } from '../mocks/test-helpers.ts'

describe('findRepoRoot', () => {
  it('returns the directory holding BACKLOG.md', () => {
    const repo = makeRepo()
    try {
      expect(findRepoRoot(repo.root)).toBe(repo.root)
    } finally {
      repo.cleanup()
    }
  })

  it('walks upward until it finds BACKLOG.md', () => {
    const repo = makeRepo()
    try {
      const sub = `${repo.root}/a/b/c`
      mkdirSync(sub, { recursive: true })
      expect(findRepoRoot(sub)).toBe(repo.root)
    } finally {
      repo.cleanup()
    }
  })

  it('throws RepoRootNotFoundError when no BACKLOG.md is found', () => {
    expect(() => findRepoRoot('/nonexistent-root-for-delto-tests')).toThrow(
      RepoRootNotFoundError
    )
  })

  it('uses process.cwd by default', () => {
    const orig = process.cwd()
    const repo = makeRepo()
    try {
      process.chdir(repo.root)
      expect(findRepoRoot()).toBe(repo.root)
    } finally {
      process.chdir(orig)
      repo.cleanup()
    }
  })
})

describe('suffixIds', () => {
  it('extracts ids from a needs: suffix', () => {
    expect(suffixIds('Body; needs: ∆aaa, ∆bbb', 'needs')).toEqual(['aaa', 'bbb'])
  })

  it('returns [] when the label is absent', () => {
    expect(suffixIds('Body without suffix', 'needs')).toEqual([])
  })

  it('stops at the next semicolon-delimited section', () => {
    expect(suffixIds('Body; needs: ∆aaa; touches: ∆bbb', 'needs')).toEqual(['aaa'])
    expect(suffixIds('Body; needs: ∆aaa; touches: ∆bbb', 'touches')).toEqual(['bbb'])
  })
})

describe('parseBacklog', () => {
  it('captures id, needs, touches, line metadata, and heading context', () => {
    const repo = makeRepo(
      `# BACKLOG

## Launch

Description of the launch initiative.

### Auth epic

- ∆AAA First item — short description; needs: ∆BBB; touches: ∆CCC

- ∆BBB Second item with
  a wrapped continuation line.

## Refactors

- ∆CCC Standalone refactor item.
`
    )
    try {
      const items = parseBacklog(repo.root)
      expect(items).toHaveLength(3)
      expect(items[0].id).toBe('AAA')
      expect(items[0].needs).toEqual(['BBB'])
      expect(items[0].touches).toEqual(['CCC'])
      expect(items[0].lineCount).toBe(1)
      expect(items[0].initiativeHeading?.text).toBe('Launch')
      expect(items[0].epicHeading?.text).toBe('Auth epic')
      expect(items[1].lineCount).toBe(2)
      expect(items[2].initiativeHeading?.text).toBe('Refactors')
      expect(items[2].epicHeading).toBeNull()
    } finally {
      repo.cleanup()
    }
  })

  it('handles a `# Title` line by clearing both heading contexts', () => {
    const repo = makeRepo(
      `## Initiative

- ∆XXX Without title, under initiative.

# Reset

- ∆YYY After a level-1 heading.
`
    )
    try {
      const items = parseBacklog(repo.root)
      expect(items[0].initiativeHeading?.text).toBe('Initiative')
      expect(items[1].initiativeHeading).toBeNull()
      expect(items[1].epicHeading).toBeNull()
    } finally {
      repo.cleanup()
    }
  })

  it('ignores empty headings (no closing flush)', () => {
    const repo = makeRepo(
      `#

- ∆ZZZ Plain item.
`
    )
    try {
      const items = parseBacklog(repo.root)
      expect(items).toHaveLength(1)
    } finally {
      repo.cleanup()
    }
  })

  it('flushes a pending item when it hits a blank line', () => {
    const repo = makeRepo(
      `## I

- ∆AAA First.

- ∆BBB Second.
`
    )
    try {
      const items = parseBacklog(repo.root)
      expect(items).toHaveLength(2)
      expect(items[0].lineCount).toBe(1)
    } finally {
      repo.cleanup()
    }
  })
})

describe('journalIds', () => {
  it('returns the ids of completed entries', () => {
    const repo = makeRepo()
    try {
      repo.writeJournal('∆AAA-foo.md', '')
      repo.writeJournal('∆BBB-bar.md', '')
      repo.writeJournal('not-an-entry.md', '')
      const ids = journalIds(repo.root)
      expect(ids.has('AAA')).toBe(true)
      expect(ids.has('BBB')).toBe(true)
      expect(ids.size).toBe(2)
    } finally {
      repo.cleanup()
    }
  })

  it('returns an empty set when the journal directory is missing', () => {
    const repo = makeRepo()
    try {
      expect(journalIds(repo.root).size).toBe(0)
    } finally {
      repo.cleanup()
    }
  })
})
