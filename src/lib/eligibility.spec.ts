import { describe, expect, it } from 'vitest'

import { type BacklogItem } from './backlog-parser.ts'
import { computeEligibility } from './eligibility.ts'

function item(
  id: string,
  opts: { needs?: string[]; touches?: string[] } = {}
): BacklogItem {
  return {
    id,
    needs: opts.needs ?? [],
    touches: opts.touches ?? [],
    lineStart: 1,
    lineCount: 1,
    initiativeHeading: null,
    epicHeading: null,
  }
}

describe('computeEligibility', () => {
  it('marks an item with no claims, needs, or touches as eligible', () => {
    const { byId, order } = computeEligibility([item('AAA')], new Set())
    expect(order[0].eligible).toBe(true)
    expect(byId.get('AAA')?.eligible).toBe(true)
  })

  it('excludes items that are claimed', () => {
    const { byId } = computeEligibility([item('AAA')], new Set(['AAA']))
    expect(byId.get('AAA')?.claimed).toBe(true)
    expect(byId.get('AAA')?.eligible).toBe(false)
  })

  it('excludes items whose needs: prerequisites are still open', () => {
    const items = [item('AAA', { needs: ['BBB'] }), item('BBB')]
    const { byId } = computeEligibility(items, new Set())
    expect(byId.get('AAA')?.openNeeds).toEqual(['BBB'])
    expect(byId.get('AAA')?.eligible).toBe(false)
    expect(byId.get('BBB')?.eligible).toBe(true)
  })

  it('treats needs on a non-open id (presumably shipped) as satisfied', () => {
    const { byId } = computeEligibility([item('AAA', { needs: ['SHIPPED'] })], new Set())
    expect(byId.get('AAA')?.openNeeds).toEqual([])
    expect(byId.get('AAA')?.eligible).toBe(true)
  })

  it('blocks items whose touches: peer is in-flight, including asymmetric edges', () => {
    const items = [item('AAA', { touches: ['BBB'] }), item('BBB')]
    const { byId } = computeEligibility(items, new Set(['BBB']))
    expect(byId.get('AAA')?.conflicts).toEqual(['BBB'])
    expect(byId.get('AAA')?.eligible).toBe(false)
  })

  it('computes the inverse `needs:` graph as `dependents`', () => {
    const items = [
      item('AAA', { needs: ['CCC'] }),
      item('BBB', { needs: ['CCC'] }),
      item('CCC'),
    ]
    const { dependents } = computeEligibility(items, new Set())
    expect(dependents.get('CCC')).toEqual(['AAA', 'BBB'])
  })

  it('preserves the input order in the `order` field', () => {
    const items = [item('AAA'), item('BBB'), item('CCC')]
    const { order } = computeEligibility(items, new Set())
    expect(order.map((e) => e.id)).toEqual(['AAA', 'BBB', 'CCC'])
  })
})
