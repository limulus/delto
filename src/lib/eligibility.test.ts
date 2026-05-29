import { describe, expect, it } from 'vitest'

import { type BacklogItem } from './backlog.ts'
import { computeEligibility } from './eligibility.ts'

function item(id: string, extra: Partial<BacklogItem> = {}): BacklogItem {
  return {
    id,
    needs: [],
    touches: [],
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
  item('ddd', { touches: ['eee', 'ggg'] }),
  item('eee'),
  item('ggg'),
]

describe('computeEligibility', () => {
  it('marks an item eligible only when unclaimed, unblocked, and unconflicting', () => {
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

    // ddd touches eee, which is claimed → conflict.
    expect(byId.get('ddd')?.eligible).toBe(false)
    expect(byId.get('ddd')?.conflicts).toEqual(['eee'])

    expect(byId.get('eee')?.eligible).toBe(false)
    expect(byId.get('eee')?.claimed).toBe(true)

    expect(byId.get('ggg')?.eligible).toBe(true)
  })

  it('treats touches as a symmetric collision graph', () => {
    // Only ddd declares the touch edges, yet claiming ddd conflicts its peers.
    const { byId } = computeEligibility(items, new Set(['ddd']))
    expect(byId.get('eee')?.conflicts).toEqual(['ddd'])
    expect(byId.get('eee')?.eligible).toBe(false)
    expect(byId.get('ggg')?.conflicts).toEqual(['ddd'])
    expect(byId.get('ggg')?.eligible).toBe(false)
  })
})
