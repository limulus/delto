import { describe, expect, it } from 'vitest'

import { type BacklogItem } from './backlog.ts'
import { CHECKS, lintBacklog } from './lint.ts'

function item(id: string, overrides: Partial<BacklogItem> = {}): BacklogItem {
  return {
    id,
    needs: [],
    lineStart: 1,
    lineCount: 1,
    initiativeHeading: null,
    epicHeading: null,
    ...overrides,
  }
}

const none = new Set<string>()

const messagesFor = (violations: { check: string; message: string }[], check: string) =>
  violations.filter((v) => v.check === check).map((v) => v.message)

describe('CHECKS', () => {
  it('names the four checks', () => {
    expect(CHECKS.map((c) => c.key)).toEqual([
      'duplicate-ids',
      'unresolved-refs',
      'needs-cycles',
      'oversized-items',
    ])
    for (const c of CHECKS) expect(c.label).toBeTruthy()
  })
})

describe('lintBacklog', () => {
  it('returns no violations for a clean backlog', () => {
    const items = [
      item('aaa'),
      item('bbb', { needs: ['aaa'], lineStart: 2 }),
      item('ccc', { needs: ['zzz'], lineStart: 3 }),
    ]
    expect(lintBacklog(items, new Set(['zzz']), 5)).toEqual([])
  })

  it('flags an ID used by more than one item, with both lines', () => {
    const items = [item('aaa', { lineStart: 3 }), item('aaa', { lineStart: 9 })]
    const msgs = messagesFor(lintBacklog(items, none, 5), 'duplicate-ids')
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toContain('∆aaa')
    expect(msgs[0]).toContain('2 items')
    expect(msgs[0]).toContain('3, 9')
  })

  it('flags an ID that reuses a completed journal entry', () => {
    const items = [item('aaa', { lineStart: 4 })]
    const msgs = messagesFor(lintBacklog(items, new Set(['aaa']), 5), 'duplicate-ids')
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toContain('∆aaa')
    expect(msgs[0]).toContain('line 4')
    expect(msgs[0]).toContain('completed')
  })

  it('flags a needs: reference to an unknown ID, once per distinct ref', () => {
    const items = [item('aaa', { needs: ['zzz', 'zzz'], lineStart: 7 })]
    const msgs = messagesFor(lintBacklog(items, none, 5), 'unresolved-refs')
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toContain('∆aaa')
    expect(msgs[0]).toContain('∆zzz')
    expect(msgs[0]).toContain('line 7')
  })

  it('accepts a needs: reference to a completed item and reports no cycle for it', () => {
    const items = [item('aaa', { needs: ['ddd'] })]
    expect(lintBacklog(items, new Set(['ddd']), 5)).toEqual([])
  })

  it('flags a two-item needs: cycle', () => {
    const items = [item('aaa', { needs: ['bbb'] }), item('bbb', { needs: ['aaa'] })]
    const msgs = messagesFor(lintBacklog(items, none, 5), 'needs-cycles')
    expect(msgs).toEqual(['∆aaa → ∆bbb → ∆aaa'])
  })

  it('flags a self-referential needs: cycle', () => {
    const items = [item('aaa', { needs: ['aaa'] })]
    const msgs = messagesFor(lintBacklog(items, none, 5), 'needs-cycles')
    expect(msgs).toEqual(['∆aaa → ∆aaa'])
  })

  it('reports a cycle once even when a duplicate needs: edge reaches it twice', () => {
    const items = [item('aaa', { needs: ['bbb'] }), item('bbb', { needs: ['aaa', 'aaa'] })]
    const msgs = messagesFor(lintBacklog(items, none, 5), 'needs-cycles')
    expect(msgs).toHaveLength(1)
  })

  it('walks shared dependencies without reporting false cycles', () => {
    const items = [
      item('aaa', { needs: ['ccc'] }),
      item('bbb', { needs: ['ccc'] }),
      item('ccc'),
    ]
    expect(lintBacklog(items, none, 5)).toEqual([])
  })

  it('flags an item spanning more than maxLines, and not one at the limit', () => {
    const items = [
      item('aaa', { lineCount: 5 }),
      item('bbb', { lineCount: 6, lineStart: 8 }),
    ]
    const msgs = messagesFor(lintBacklog(items, none, 5), 'oversized-items')
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toContain('∆bbb')
    expect(msgs[0]).toContain('line 8')
    expect(msgs[0]).toContain('6 lines')
    expect(msgs[0]).toContain('max 5')
  })
})
