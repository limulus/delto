import { type BacklogItem } from './backlog.ts'

/** The eligibility verdict for one BACKLOG.md item. */
export interface ItemEligibility {
  id: string
  /** True when the item is free to work on — not claimed, blocked, or conflicting. */
  eligible: boolean
  /** The item itself is claimed in the ledger (someone is already on it). */
  claimed: boolean
  /** `needs:` prerequisites still open as BACKLOG items (empty when unblocked). */
  openNeeds: string[]
  /** `touches:` peers that are currently claimed (same-file collision risk). */
  conflicts: string[]
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

  // `touches:` is a same-file collision graph; treat it as symmetric for robustness —
  // a one-sided edge still blocks both ends.
  const touchPeers = new Map<string, Set<string>>()
  const link = (a: string, b: string): void => {
    const s = touchPeers.get(a) ?? new Set<string>()
    s.add(b)
    touchPeers.set(a, s)
  }
  for (const it of items) {
    for (const p of it.touches) {
      link(it.id, p)
      link(p, it.id)
    }
  }

  // Inverse of the `needs:` graph — which items each task would unblock. BACKLOG.md
  // states each item's own needs, but not how many wait on it, and that inversion is
  // what makes one eligible item higher-leverage than another.
  const dependents = new Map<string, string[]>()
  for (const it of items) {
    for (const n of it.needs) {
      const arr = dependents.get(n) ?? []
      arr.push(it.id)
      dependents.set(n, arr)
    }
  }

  const order: ItemEligibility[] = []
  const byId = new Map<string, ItemEligibility>()
  for (const it of items) {
    const openNeeds = it.needs.filter((n) => backlogIds.has(n))
    const conflicts = [...(touchPeers.get(it.id) ?? [])].filter((p) => claimed.has(p))
    const verdict: ItemEligibility = {
      id: it.id,
      claimed: claimed.has(it.id),
      openNeeds,
      conflicts,
      eligible: !claimed.has(it.id) && openNeeds.length === 0 && conflicts.length === 0,
    }
    order.push(verdict)
    byId.set(it.id, verdict)
  }
  return { byId, order, dependents }
}
