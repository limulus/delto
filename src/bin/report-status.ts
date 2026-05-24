#!/usr/bin/env node
/**
 * report-status.ts
 *
 * A read-only progress report over BACKLOG.md. Three lenses:
 *   1. Progress by initiative — open items per `##` initiative, split into eligible /
 *      blocked / in-flight, plus that initiative's deepest `needs:` chain.
 *   2. Eligible now — the task IDs free to plan, grouped under their initiative.
 *   3. Critical path to the next milestone — the longest `needs:` chain among the open
 *      items of the next initiative, a lower bound on sequential planning cycles left.
 *
 * Scope note on "completed vs remaining": journal entries (docs/journal/∆xxx-*.md) do
 * not record which initiative they belonged to, so per-initiative *completed* counts are
 * not derivable. This report gives a global completed count and per-initiative
 * *remaining* counts only.
 *
 * `## Refactors` is a standing initiative, not a launch milestone, so it is skipped when
 * picking the "next milestone"; it still appears in the per-initiative table when it
 * holds open items.
 *
 * Usage:
 *   node .claude/skills/backlog-status/report-status.ts [--json]
 *
 * Runs on Node's built-in TypeScript type-stripping — no build step, no flag. Keep this
 * file to erasable-only syntax (no enums, namespaces, or parameter properties).
 */

import {
  findRepoRoot,
  journalIds,
  parseBacklog,
  type BacklogItem,
} from '../lib/backlog-parser.ts'
import { claimedIds } from '../lib/claims-ledger.ts'
import { computeEligibility } from '../lib/eligibility.ts'

const REFACTORS = 'Refactors'

const repoRoot = findRepoRoot()
const items = parseBacklog(repoRoot)
const completed = journalIds(repoRoot).size
const { byId } = computeEligibility(items, claimedIds())

// --- Group items by their `##` initiative, in document (priority) order ------

interface Initiative {
  name: string
  items: BacklogItem[]
}
const initiatives: Initiative[] = []
const initiativeByName = new Map<string, Initiative>()
for (const it of items) {
  const name = it.initiativeHeading?.text ?? '(no initiative)'
  let group = initiativeByName.get(name)
  if (!group) {
    group = { name, items: [] }
    initiativeByName.set(name, group)
    initiatives.push(group)
  }
  group.items.push(it)
}

// --- Planning-state buckets --------------------------------------------------

// Exactly one bucket per item: in-flight (someone is on it) wins over blocked (an open
// prerequisite or a same-file conflict), which wins over eligible.
function bucketOf(id: string): 'inFlight' | 'blocked' | 'eligible' {
  const v = byId.get(id)
  if (!v || v.claimed) return 'inFlight'
  if (v.eligible) return 'eligible'
  return 'blocked'
}

// --- Deepest `needs:` chain among the open items -----------------------------

const openIds = new Set(items.map((i) => i.id))
const needsOf = new Map<string, string[]>()
for (const it of items) {
  needsOf.set(
    it.id,
    it.needs.filter((n) => openIds.has(n))
  )
}

// Longest chain of open items ending at `id`, walking `needs:` down to a leaf
// prerequisite. Memoized. `onPath` cuts the back-edge of a malformed `needs:` cycle
// (refine-backlog flags cycles separately) so this terminates instead of recursing
// forever; on an acyclic graph — the lint-enforced norm — the memo is exact.
const chainMemo = new Map<string, string[]>()
const onPath = new Set<string>()
function longestChain(id: string): string[] {
  const cached = chainMemo.get(id)
  if (cached) return cached
  if (onPath.has(id)) return [id]
  onPath.add(id)
  let deepest: string[] = []
  for (const n of needsOf.get(id) ?? []) {
    const c = longestChain(n)
    if (c.length > deepest.length) deepest = c
  }
  onPath.delete(id)
  const chain = [...deepest, id]
  chainMemo.set(id, chain)
  return chain
}

/** The deepest `needs:` chain ending at any open item of the initiative. */
function criticalPath(group: Initiative): string[] {
  let best: string[] = []
  for (const it of group.items) {
    const c = longestChain(it.id)
    if (c.length > best.length) best = c
  }
  return best
}

// --- Assemble per-initiative rows --------------------------------------------

interface Row {
  name: string
  open: number
  eligible: string[]
  blocked: string[]
  inFlight: string[]
  criticalPath: string[]
}
const rows: Row[] = initiatives.map((group) => {
  const row: Row = {
    name: group.name,
    open: group.items.length,
    eligible: [],
    blocked: [],
    inFlight: [],
    criticalPath: criticalPath(group),
  }
  for (const it of group.items) row[bucketOf(it.id)].push(it.id)
  return row
})

// The next milestone is the first initiative with open work that is not the standing
// `## Refactors` list.
const nextMilestone = rows.find((r) => r.name !== REFACTORS) ?? rows[0] ?? null

const totalOpen = items.length
const totalEligible = rows.reduce((n, r) => n + r.eligible.length, 0)
const totalBlocked = rows.reduce((n, r) => n + r.blocked.length, 0)
const totalInFlight = rows.reduce((n, r) => n + r.inFlight.length, 0)

// --- Output ------------------------------------------------------------------

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      {
        openItems: totalOpen,
        completed,
        initiatives: rows.map((r) => ({
          name: r.name,
          open: r.open,
          eligible: r.eligible,
          blocked: r.blocked,
          inFlight: r.inFlight,
          criticalPath: r.criticalPath,
        })),
        nextMilestone: nextMilestone ? nextMilestone.name : null,
      },
      null,
      2
    )
  )
} else {
  const out: string[] = []
  out.push(
    `BACKLOG STATUS — ${totalOpen} open item(s) across ${rows.length} initiative(s) · ` +
      `${completed} completed (docs/journal/)`
  )

  // Per-initiative table.
  out.push('')
  out.push('PROGRESS BY INITIATIVE')
  out.push('')
  const nameWidth = Math.max(10, ...rows.map((r) => r.name.length), 'Total'.length)
  const cell = (s: string | number, w: number): string => String(s).padStart(w)
  const headerRow =
    '  ' +
    'Initiative'.padEnd(nameWidth) +
    cell('Open', 6) +
    cell('Eligible', 10) +
    cell('Blocked', 9) +
    cell('In-flight', 11) +
    cell('Crit', 6)
  out.push(headerRow)
  out.push('  ' + '─'.repeat(headerRow.length - 2))
  for (const r of rows) {
    out.push(
      '  ' +
        r.name.padEnd(nameWidth) +
        cell(r.open, 6) +
        cell(r.eligible.length, 10) +
        cell(r.blocked.length, 9) +
        cell(r.inFlight.length, 11) +
        cell(r.criticalPath.length, 6)
    )
  }
  out.push('  ' + '─'.repeat(headerRow.length - 2))
  out.push(
    '  ' +
      'Total'.padEnd(nameWidth) +
      cell(totalOpen, 6) +
      cell(totalEligible, 10) +
      cell(totalBlocked, 9) +
      cell(totalInFlight, 11) +
      cell('', 6)
  )

  // Eligible IDs, grouped by initiative.
  out.push('')
  out.push(`ELIGIBLE NOW — ${totalEligible} task(s) free to plan`)
  out.push('')
  if (totalEligible === 0) {
    out.push('  (none — every open task is blocked or in-flight)')
  } else {
    for (const r of rows) {
      if (r.eligible.length === 0) continue
      out.push(
        '  ' + r.name.padEnd(nameWidth) + '  ' + r.eligible.map((id) => '∆' + id).join(' ')
      )
    }
  }

  // Critical path to the next milestone.
  out.push('')
  if (!nextMilestone) {
    out.push('CRITICAL PATH — no open items.')
  } else {
    out.push(`CRITICAL PATH TO NEXT MILESTONE — ${nextMilestone.name}`)
    out.push('')
    const path = nextMilestone.criticalPath
    if (new Set(path).size < path.length) {
      // A repeated ID means longestChain() walked into a needs: cycle and the
      // cycle guard cut it — the depth is not a real critical path. refine-backlog
      // is the authority on cycles; just point there.
      out.push('  This milestone has a needs: cycle, so its critical path cannot be')
      out.push('  measured. Run the refine-backlog skill to locate and fix it. Chain:')
      out.push('')
      out.push('    ' + path.map((id) => '∆' + id).join(' → '))
    } else if (path.length <= 1) {
      out.push(
        `  Deepest needs: chain is ${path.length} level — its ${nextMilestone.open} ` +
          'open item(s) carry no prerequisites and can be planned in parallel.'
      )
    } else {
      out.push(
        `  Deepest needs: chain is ${path.length} levels — at least ${path.length} ` +
          'sequential planning cycles remain for this milestone:'
      )
      out.push('')
      out.push('    ' + path.map((id) => '∆' + id).join(' → '))
      out.push('')
      for (const id of path) out.push(`    ∆${id}  ${bucketOf(id)}`)
    }
  }
  console.log(out.join('\n'))
}
