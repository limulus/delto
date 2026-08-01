import { type BacklogItem } from './backlog.ts'

/** One structural-integrity failure, keyed to the check that found it. */
export interface Violation {
  check: string
  message: string
}

export interface Check {
  key: string
  label: string
}

/** The lint checks, in report order. Every `Violation.check` is one of these keys. */
export const CHECKS: Check[] = [
  { key: 'duplicate-ids', label: 'Duplicate IDs' },
  { key: 'unresolved-refs', label: 'Unresolved needs: references' },
  { key: 'needs-cycles', label: 'needs: dependency cycles' },
  { key: 'oversized-items', label: 'Oversized items' },
]

/**
 * Check BACKLOG.md structural integrity: duplicate IDs (within the backlog, or reusing a
 * completed journal entry's ID), unresolved `needs:` references, `needs:` dependency
 * cycles, and items spanning more than `maxLines` lines. Pure and read-only — reporting
 * is the caller's job, fixing is the agent's.
 */
export function lintBacklog(
  items: BacklogItem[],
  completedIds: Set<string>,
  maxLines: number
): Violation[] {
  const violations: Violation[] = []
  const report = (check: string, message: string): void => {
    violations.push({ check, message })
  }
  const backlogIds = new Set(items.map((i) => i.id))

  const byId = new Map<string, BacklogItem[]>()
  for (const it of items) {
    const occ = byId.get(it.id) ?? []
    occ.push(it)
    byId.set(it.id, occ)
  }
  for (const [id, occ] of byId) {
    if (occ.length > 1) {
      report(
        'duplicate-ids',
        `∆${id} is used by ${occ.length} items (lines ${occ.map((o) => o.lineStart).join(', ')})`
      )
    }
    if (completedIds.has(id)) {
      report(
        'duplicate-ids',
        `∆${id} (line ${occ[0].lineStart}) reuses the ID of a completed journal entry`
      )
    }
  }

  for (const it of items) {
    for (const ref of new Set(it.needs)) {
      if (!backlogIds.has(ref) && !completedIds.has(ref)) {
        report(
          'unresolved-refs',
          `∆${it.id} (line ${it.lineStart}) — needs: ∆${ref}, which is neither a live nor a completed item`
        )
      }
    }
  }

  // Cycle detection walks only live-to-live edges: a `needs:` on a completed item is
  // satisfied, not a loop. `seenCycles` dedupes by member set so a duplicate edge cannot
  // report the same cycle twice.
  const needsGraph = new Map<string, string[]>()
  for (const it of items) {
    needsGraph.set(
      it.id,
      it.needs.filter((n) => backlogIds.has(n))
    )
  }
  const VISITING = 1
  const DONE = 2
  const state = new Map<string, number>()
  const path: string[] = []
  const seenCycles = new Set<string>()
  const walk = (node: string): void => {
    state.set(node, VISITING)
    path.push(node)
    // Walked nodes are always backlog ids (roots come from `items`, edges are filtered
    // to `backlogIds`), so the graph lookup is total.
    for (const next of needsGraph.get(node) as string[]) {
      const s = state.get(next)
      if (s === VISITING) {
        const cycle = path.slice(path.indexOf(next))
        const key = [...cycle].sort().join(',')
        if (!seenCycles.has(key)) {
          seenCycles.add(key)
          report(
            'needs-cycles',
            cycle
              .concat(next)
              .map((c) => '∆' + c)
              .join(' → ')
          )
        }
      } else if (s === undefined) {
        walk(next)
      }
    }
    path.pop()
    state.set(node, DONE)
  }
  for (const it of items) {
    if (state.get(it.id) === undefined) walk(it.id)
  }

  for (const it of items) {
    if (it.lineCount > maxLines) {
      report(
        'oversized-items',
        `∆${it.id} (line ${it.lineStart}) spans ${it.lineCount} lines (max ${maxLines})`
      )
    }
  }

  return violations
}
