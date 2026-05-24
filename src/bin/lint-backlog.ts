/**
 * lint-backlog.ts
 *
 * Checks BACKLOG.md structural integrity and reports violations. Read-only — it never
 * edits the file; the refine-backlog skill drives the fixes. Five checks:
 *   1. duplicate IDs      — an ID on >1 item, or colliding with a completed journal entry;
 *   2. unresolved refs    — a needs:/touches: ID naming no live or completed item;
 *   3. needs: cycles      — a dependency loop among live BACKLOG items;
 *   4. touches: symmetry  — A lists touches: B but B omits the reverse edge;
 *   5. oversized items    — an item spanning more than 5 lines.
 *
 * Exit 0 when clean, 1 when any violation is found. `--json` for machine-readable output.
 *
 * Library entry point — exposes `main(argv, opts)` for the `delto` CLI dispatcher.
 * End users invoke it as `delto refine [--json]` (or `delto lint`).
 */

import { type MainOpts, defaults } from './main.ts'
import {
  findRepoRoot,
  journalIds,
  parseBacklog,
  type BacklogItem,
} from '../lib/backlog-parser.ts'

const MAX_ITEM_LINES = 5

const CHECKS = [
  { key: 'duplicate-ids', label: 'Duplicate IDs' },
  { key: 'unresolved-refs', label: 'Unresolved needs:/touches: references' },
  { key: 'needs-cycles', label: 'needs: dependency cycles' },
  { key: 'touches-asymmetry', label: 'touches: edge symmetry' },
  { key: 'oversized-items', label: `Items over ${MAX_ITEM_LINES} lines` },
]

interface Violation {
  check: string
  message: string
}

export function main(argv: string[], opts: MainOpts = {}): number {
  const { log, cwd } = defaults(opts)
  const repoRoot = findRepoRoot(cwd)
  const items = parseBacklog(repoRoot)
  const shipped = journalIds(repoRoot)
  const backlogIds = new Set(items.map((i) => i.id))

  const violations: Violation[] = []
  const report = (check: string, message: string): void => {
    violations.push({ check, message })
  }

  const byId = new Map<string, BacklogItem[]>()
  for (const it of items) {
    const arr = byId.get(it.id) ?? []
    arr.push(it)
    byId.set(it.id, arr)
  }
  for (const [id, occ] of byId) {
    if (occ.length > 1) {
      report(
        'duplicate-ids',
        `∆${id} is used by ${occ.length} items (lines ${occ.map((o) => o.lineStart).join(', ')})`
      )
    }
    if (shipped.has(id)) {
      report(
        'duplicate-ids',
        `∆${id} (line ${occ[0].lineStart}) reuses the ID of a completed item in docs/journal/`
      )
    }
  }

  const known = new Set<string>([...backlogIds, ...shipped])
  for (const it of items) {
    for (const ref of it.needs) {
      if (!known.has(ref)) {
        report(
          'unresolved-refs',
          `∆${it.id} (line ${it.lineStart}) — needs: ∆${ref}, which is neither a live nor a completed item`
        )
      }
    }
    for (const ref of it.touches) {
      if (!known.has(ref)) {
        report(
          'unresolved-refs',
          `∆${it.id} (line ${it.lineStart}) — touches: ∆${ref}, which is neither a live nor a completed item`
        )
      }
    }
  }

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
    for (const next of needsGraph.get(node)!) {
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

  const touchesOf = new Map<string, Set<string>>()
  for (const it of items) {
    touchesOf.set(it.id, new Set(it.touches))
  }
  for (const it of items) {
    for (const peer of it.touches) {
      if (!backlogIds.has(peer)) continue
      const back = touchesOf.get(peer)
      if (back && !back.has(it.id)) {
        report(
          'touches-asymmetry',
          `∆${it.id} (line ${it.lineStart}) lists touches: ∆${peer}, but ∆${peer} omits ∆${it.id}`
        )
      }
    }
  }

  for (const it of items) {
    if (it.lineCount > MAX_ITEM_LINES) {
      report(
        'oversized-items',
        `∆${it.id} (line ${it.lineStart}) spans ${it.lineCount} lines (max ${MAX_ITEM_LINES})`
      )
    }
  }

  const byCheck = new Map<string, string[]>()
  for (const v of violations) {
    const arr = byCheck.get(v.check) ?? []
    arr.push(v.message)
    byCheck.set(v.check, arr)
  }

  if (argv.includes('--json')) {
    log(
      JSON.stringify(
        {
          ok: violations.length === 0,
          itemCount: items.length,
          checks: CHECKS.map((c) => ({
            key: c.key,
            label: c.label,
            ok: !byCheck.has(c.key),
            violations: byCheck.get(c.key) ?? [],
          })),
        },
        null,
        2
      )
    )
  } else {
    const lines: string[] = []
    lines.push(
      violations.length === 0
        ? `BACKLOG.md refinement — clean: all ${CHECKS.length} integrity checks pass (${items.length} items).`
        : `BACKLOG.md refinement — ${violations.length} violation(s) across ${items.length} items.`
    )
    lines.push('')
    for (const c of CHECKS) {
      const vs = byCheck.get(c.key) ?? []
      lines.push(`${vs.length === 0 ? '✓' : '✗'} ${c.label}`)
      for (const m of vs) lines.push(`    ${m}`)
    }
    if (violations.length > 0) {
      lines.push('')
      lines.push('Fix these in BACKLOG.md (or the relevant journal entry), then re-run.')
    }
    log(lines.join('\n'))
  }

  return violations.length === 0 ? 0 : 1
}
