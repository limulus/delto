/**
 * eligibility.ts
 *
 * Shared "is this task free to plan right now?" computation for the backlog-tooling
 * skills. `find-eligible-tasks.ts` (plan-backlog-item) turns it into a priority-ordered
 * pick list; `report-status.ts` (backlog-status) turns it into a per-initiative progress
 * breakdown. Keeping the rule in one place means both skills agree on what "eligible",
 * "blocked", and "in-flight" mean.
 *
 * A task is eligible unless it is:
 *   - in-flight   — claimed in the local ledger;
 *   - blocked     — a `; needs: ∆xxx` prerequisite is still open (still in BACKLOG.md);
 *   - conflicting — a `; touches: ∆xxx` peer (same-file collision) is currently in-flight.
 *
 * Runs on Node's built-in TypeScript type-stripping — no build step, no flag. Keep this
 * file to erasable-only syntax (no enums, namespaces, or parameter properties).
 */

import { type BacklogItem } from './backlog-parser.ts'

/** The eligibility verdict for one BACKLOG.md item. */
export interface ItemEligibility {
  id: string
  /** True when the task is free to plan — not claimed, blocked, or conflicting. */
  eligible: boolean
  /** The task itself is claimed in the ledger (someone is already on it). */
  claimed: boolean
  /** `needs:` prerequisites that are still open BACKLOG items (empty when unblocked). */
  openNeeds: string[]
  /** `touches:` peers that are currently claimed (same-file collision risk). */
  conflicts: string[]
}

export interface EligibilityResult {
  /** Per-item verdicts, keyed by task ID. */
  byId: Map<string, ItemEligibility>
  /** Per-item verdicts in BACKLOG.md document order (which is priority order). */
  order: ItemEligibility[]
  /** Inverse of the `needs:` graph — for each task, the IDs that name it as a
   *  prerequisite. A task with many dependents is a higher-leverage pick. */
  dependents: Map<string, string[]>
}

/** Classify every backlog item as eligible or not, given the set of claimed IDs. */
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
  // states each item's own needs, but not how many items wait on it, and that
  // inversion is what makes one eligible task higher-leverage than another.
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
