import { parseArgs } from 'node:util'

import { type Subcommand } from './delto.ts'
import { requireRepoRoot } from './preconditions.ts'
import { parseBacklog } from '../lib/backlog.ts'
import { claimedIds } from '../lib/claims-ledger.ts'
import { computeEligibility, type ItemEligibility } from '../lib/eligibility.ts'
import { cwd, err, out } from '../lib/io.ts'

const HELP = `delto surface — find backlog items that are free to work on now

Usage: delto surface [--json]

Reads the nearest BACKLOG.md plus the local claim ledger, walks the needs: graph, and
lists the items that are eligible — not claimed and not blocked by an open prerequisite —
in priority (document) order.

Options:
  --json      Emit the full verdict (eligible, excluded with reasons, claimed) as JSON.
  -h, --help  Show this help.
`

/** Spell out, in priority order, why an excluded item is not free to work on. */
function reasonFor(e: ItemEligibility): string {
  const reasons: string[] = []
  if (e.claimed) reasons.push('in-flight (claimed)')
  if (e.openNeeds.length > 0)
    reasons.push(`needs ${e.openNeeds.map((n) => '∆' + n).join(', ')}`)
  return reasons.join('; ')
}

export const surface: Subcommand = {
  name: 'surface',
  summary: 'surface backlog items that are eligible to work on',
  async run(argv, opts) {
    const stdout = out(opts)
    const stderr = err(opts)

    let json = false
    let help = false
    try {
      const { values } = parseArgs({
        args: argv,
        options: { json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } },
        strict: true,
      })
      json = values.json ?? false
      help = values.help ?? false
    } catch (error) {
      stderr.write(`delto surface: ${(error as Error).message}\n`)
      return 1
    }

    if (help) {
      stdout.write(HELP)
      return 0
    }

    const dir = cwd(opts)
    const root = requireRepoRoot(dir, stderr, 'surface')
    if (root === null) return 1

    const items = parseBacklog(root)
    const claimed = claimedIds(root)
    const { order, dependents } = computeEligibility(items, claimed)
    const eligible = order.filter((e) => e.eligible).map((e) => e.id)
    const excluded = order
      .filter((e) => !e.eligible)
      .map((e) => ({ id: e.id, reason: reasonFor(e) }))

    if (json) {
      stdout.write(
        JSON.stringify(
          {
            eligible: eligible.map((id) => ({ id, unblocks: dependents.get(id) ?? [] })),
            excluded,
            claimed: [...claimed],
          },
          null,
          2
        ) + '\n'
      )
      return 0
    }

    const lines: string[] = [
      `ELIGIBLE — ${eligible.length} of ${items.length} backlog item(s) free to work on, in priority order.`,
    ]
    if (eligible.length === 0) {
      lines.push('', '  (none — every backlog item is claimed or blocked)')
    } else {
      lines.push(
        '`→N` = N other items name this one in their `needs:` — doing it unblocks them.',
        ''
      )
      for (const id of eligible) {
        const n = (dependents.get(id) ?? []).length
        lines.push(`  ∆${id}${n > 0 ? ` →${n}` : ''}`)
      }
    }
    if (excluded.length > 0) {
      lines.push(
        '',
        `(${excluded.length} other item(s) are claimed or needs-blocked — run with --json for which and why.)`
      )
    }
    stdout.write(lines.join('\n') + '\n')
    return 0
  },
}
