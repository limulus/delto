import { describe, expect, it } from 'vitest'

import { type BacklogItem } from './backlog.ts'
import { computeEligibility } from './eligibility.ts'

function item(id: string, extra: Partial<BacklogItem> = {}): BacklogItem {
  return {
    id,
    needs: [],
    lineStart: 0,
    lineCount: 1,
    initiativeHeading: null,
    epicHeading: null,
    ...extra,
  }
}

const items: BacklogItem[] = [
  item('aaa'),
  item('bbb', { needs: ['aaa'] }),
  item('fff', { needs: ['aaa'] }),
  item('ccc', { needs: ['zzz'] }),
  item('ddd'),
  item('eee'),
  item('ggg'),
]

describe('computeEligibility', () => {
  it('marks an item eligible only when unclaimed and unblocked', () => {
    const { byId, order, dependents } = computeEligibility(items, new Set(['eee']))

    expect(order.map((e) => e.id)).toEqual([
      'aaa',
      'bbb',
      'fff',
      'ccc',
      'ddd',
      'eee',
      'ggg',
    ])

    expect(byId.get('aaa')?.eligible).toBe(true)
    expect(dependents.get('aaa')).toEqual(['bbb', 'fff'])

    expect(byId.get('bbb')?.eligible).toBe(false)
    expect(byId.get('bbb')?.openNeeds).toEqual(['aaa'])

    // A need that is not itself a backlog item is treated as satisfied (completed).
    expect(byId.get('ccc')?.eligible).toBe(true)
    expect(byId.get('ccc')?.openNeeds).toEqual([])

    expect(byId.get('ddd')?.eligible).toBe(true)

    expect(byId.get('eee')?.eligible).toBe(false)
    expect(byId.get('eee')?.claimed).toBe(true)

    expect(byId.get('ggg')?.eligible).toBe(true)
  })

  it('dedupes a repeated id in a needs: suffix so dependents are not double-counted', () => {
    const dup = [item('aaa'), item('bbb', { needs: ['aaa', 'aaa'] })]
    const { byId, dependents } = computeEligibility(dup, new Set())
    expect(dependents.get('aaa')).toEqual(['bbb'])
    expect(byId.get('bbb')?.openNeeds).toEqual(['aaa'])
  })
})
