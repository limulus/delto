import { type BacklogItem } from './backlog.ts'

/** The eligibility verdict for one BACKLOG.md item. */
export interface ItemEligibility {
  id: string
  /** True when the item is free to work on — not claimed and not blocked. */
  eligible: boolean
  /** The item itself is claimed in the ledger (someone is already on it). */
  claimed: boolean
  /** `needs:` prerequisites still open as BACKLOG items (empty when unblocked). */
  openNeeds: string[]
}

export interface EligibilityResult {
  /** Per-item verdicts, keyed by id. */
  byId: Map<string, ItemEligibility>
  /** Per-item verdicts in document (priority) order. */
  order: ItemEligibility[]
  /** Inverse of the `needs:` graph — for each id, the items that name it as a
   *  prerequisite. An item with many dependents is a higher-leverage pick. */
  dependents: Map<string, string[]>
}

/** Classify every backlog item as eligible or not, given the set of claimed ids. */
export function computeEligibility(
  items: BacklogItem[],
  claimed: Set<string>
): EligibilityResult {
  const backlogIds = new Set(items.map((i) => i.id))

  // Inverse of the `needs:` graph — which items each task would unblock. BACKLOG.md states
  // each item's own needs, but not how many wait on it, and that inversion is what makes
  // one eligible item higher-leverage than another. Dedupe each item's needs so a malformed
  // `needs: ∆a, ∆a` suffix cannot count the same dependent twice.
  const dependents = new Map<string, string[]>()
  for (const it of items) {
    for (const n of new Set(it.needs)) {
      const arr = dependents.get(n) ?? []
      arr.push(it.id)
      dependents.set(n, arr)
    }
  }

  const order: ItemEligibility[] = []
  const byId = new Map<string, ItemEligibility>()
  for (const it of items) {
    const openNeeds = [...new Set(it.needs)].filter((n) => backlogIds.has(n))
    const verdict: ItemEligibility = {
      id: it.id,
      claimed: claimed.has(it.id),
      openNeeds,
      eligible: !claimed.has(it.id) && openNeeds.length === 0,
    }
    order.push(verdict)
    byId.set(it.id, verdict)
  }
  return { byId, order, dependents }
}
