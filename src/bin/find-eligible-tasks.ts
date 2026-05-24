#!/usr/bin/env node
/**
 * find-eligible-tasks.ts
 *
 * Lists the BACKLOG.md task IDs that are free to `/plan` right now. An item is excluded
 * when it is:
 *   - in-flight   — claimed in the local ledger (the single in-flight source of truth);
 *   - blocked     — a `; needs: ∆xxx` prerequisite is still open (still in BACKLOG.md);
 *   - conflicting — a `; touches: ∆xxx` peer (same-file collision) is currently in-flight.
 *
 * `needs:`/`touches:` are the trailing dependency suffixes on BACKLOG.md items — see the
 * BACKLOG.md header and CLAUDE.md. The ledger only records claimed IDs; claims never
 * expire (a claim persists through long reviews until --release or task completion).
 *
 * The eligibility rule itself lives in `../lib/eligibility.ts`, shared with the
 * backlog-status skill so both agree on what "eligible" means; this file is the
 * plan-backlog-item CLI around it.
 *
 * Usage:
 *   node .claude/skills/plan-backlog-item/find-eligible-tasks.ts [--json]
 *   node .claude/skills/plan-backlog-item/find-eligible-tasks.ts --claim <id>
 *   node .claude/skills/plan-backlog-item/find-eligible-tasks.ts --release <id>
 *
 * Runs on Node's built-in TypeScript type-stripping — no build step, no flag. Keep this
 * file to erasable-only syntax (no enums, namespaces, or parameter properties).
 */

import { relative } from 'node:path'

import { ID, findRepoRoot, parseBacklog } from '../lib/backlog-parser.ts'
import { CLAIMS_FILE, claim, claimedIds, release } from '../lib/claims-ledger.ts'
import { computeEligibility, type ItemEligibility } from '../lib/eligibility.ts'

const repoRoot = findRepoRoot()

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

// --- Subcommands ------------------------------------------------------------

const argv = process.argv.slice(2)

function flagValue(flag: string): string | null {
  const i = argv.indexOf(flag)
  return i === -1 ? null : (argv[i + 1] ?? '')
}

function requireId(raw: string, flag: string): string {
  const id = raw.replace(/^∆/, '').trim()
  if (!new RegExp(`^${ID}$`).test(id)) {
    console.error(`${flag} needs a 3-char task ID (got: ${JSON.stringify(raw)})`)
    process.exit(1)
  }
  return id
}

const claimArg = flagValue('--claim')
if (claimArg !== null) {
  const id = requireId(claimArg, '--claim')
  claim(id)
  console.log(`Claimed ∆${id} — recorded in ${relative(repoRoot, CLAIMS_FILE)}.`)
  console.log(`Release it with --release ${id} if you abandon planning.`)
  process.exit(0)
}

const releaseArg = flagValue('--release')
if (releaseArg !== null) {
  const id = requireId(releaseArg, '--release')
  release(id)
  console.log(`Released ∆${id} — eligible for planning again.`)
  process.exit(0)
}

// --- Report -----------------------------------------------------------------

const items = parseBacklog(repoRoot)
const claimed = claimedIds()
const { order, dependents } = computeEligibility(items, claimed)

const eligible = order.filter((e) => e.eligible).map((e) => e.id)

/** Spell out, in priority order, why an excluded task is not free to plan. */
function reasonFor(e: ItemEligibility): string {
  const reasons: string[] = []
  if (e.claimed) reasons.push('in-flight (claimed)')
  if (e.openNeeds.length > 0) {
    reasons.push(`needs ${e.openNeeds.map((n) => '∆' + n).join(', ')}`)
  }
  if (e.conflicts.length > 0) {
    reasons.push(
      `shares files with in-flight ${e.conflicts.map((c) => '∆' + c).join(', ')}`
    )
  }
  return reasons.join('; ')
}

const excluded = order
  .filter((e) => !e.eligible)
  .map((e) => ({ id: e.id, reason: reasonFor(e) }))

/** `∆id`, suffixed with `→N` when N other items name it as a `needs:` prerequisite. */
function eligibleLabel(id: string): string {
  const n = (dependents.get(id) ?? []).length
  return '∆' + id + (n > 0 ? '→' + n : '')
}

if (argv.includes('--json')) {
  console.log(
    JSON.stringify(
      {
        eligible: eligible.map((id) => ({ id, unblocks: dependents.get(id) ?? [] })),
        excluded,
        claimed: [...claimed],
      },
      null,
      2
    )
  )
} else {
  const lines: string[] = []
  lines.push(
    `ELIGIBLE — ${eligible.length} of ${items.length} backlog task(s) free to plan, in priority order.`
  )
  lines.push(
    '`→N` = N other items name this task in their `needs:` — planning it unblocks them.'
  )
  lines.push('')
  if (eligible.length === 0) {
    lines.push('  (none — every backlog task is claimed, blocked, or conflicting)')
  }
  for (const row of chunk(eligible, 8)) {
    lines.push(
      '  ' +
        row
          .map((id) => eligibleLabel(id).padEnd(8))
          .join('')
          .trimEnd()
    )
  }
  if (excluded.length > 0) {
    lines.push('')
    lines.push(
      `(${excluded.length} other task(s) are claimed, \`needs:\`-blocked, or ` +
        '`touches:`-conflicting — run with --json for which and why.)'
    )
  }
  lines.push('')
  lines.push('Next: read BACKLOG.md, then plan the highest-priority eligible task — when')
  lines.push(
    'priorities are close, a higher `→N` unblocks more of the backlog. --claim <id> first.'
  )
  console.log(lines.join('\n'))
}
