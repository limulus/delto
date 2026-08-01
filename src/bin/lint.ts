import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { type Subcommand } from './delto.ts'
import { requireRepoRoot } from './preconditions.ts'
import { parseBacklog } from '../lib/backlog.ts'
import { cwd, err, out } from '../lib/io.ts'
import { journalIds } from '../lib/journal.ts'
import { CHECKS, lintBacklog } from '../lib/lint.ts'

const HELP = `delto lint — check BACKLOG.md structural integrity

Usage: delto lint --journal-dir <dir> [--max-lines <n>] [--json]

Reads the nearest BACKLOG.md (found by walking up from the current directory) and runs
four deterministic checks: duplicate IDs (within the backlog, or reusing a completed
journal entry's ID), unresolved needs: references, needs: dependency cycles, and
oversized items. Read-only — it reports violations and never edits the file.

Exits 0 when clean, 1 when any violation is found.

Options:
  --journal-dir <dir>  Directory of completed journal entries, relative to the current
                       directory (required). A completed ID satisfies a needs:
                       reference but must not be reused by a live item.
  --max-lines <n>      Maximum source lines an item may span (default: 5).
  --json               Emit the full verdict as JSON.
  -h, --help           Show this help.
`

export const lint: Subcommand = {
  name: 'lint',
  summary: 'check BACKLOG.md structural integrity',
  async run(argv, opts) {
    const stdout = out(opts)
    const stderr = err(opts)

    let journalDir: string | undefined
    let maxLinesRaw: string | undefined
    let json = false
    let help = false
    try {
      const { values } = parseArgs({
        args: argv,
        options: {
          'journal-dir': { type: 'string' },
          'max-lines': { type: 'string' },
          json: { type: 'boolean' },
          help: { type: 'boolean', short: 'h' },
        },
        strict: true,
      })
      journalDir = values['journal-dir']
      maxLinesRaw = values['max-lines']
      json = values.json ?? false
      help = values.help ?? false
    } catch (error) {
      stderr.write(`delto lint: ${(error as Error).message}\n`)
      return 1
    }

    if (help) {
      stdout.write(HELP)
      return 0
    }

    if (!journalDir) {
      stderr.write('delto lint: --journal-dir <dir> is required.\n')
      return 1
    }

    let maxLines = 5
    if (maxLinesRaw !== undefined) {
      if (!/^[0-9]+$/.test(maxLinesRaw) || Number(maxLinesRaw) < 1) {
        stderr.write(
          `delto lint: --max-lines must be a positive integer (got: ${JSON.stringify(maxLinesRaw)}).\n`
        )
        return 1
      }
      maxLines = Number(maxLinesRaw)
    }

    const dir = cwd(opts)
    const root = requireRepoRoot(dir, stderr, 'lint')
    if (root === null) return 1

    const items = parseBacklog(root)
    const completed = await journalIds(resolve(dir, journalDir))
    const violations = lintBacklog(items, completed, maxLines)

    const byCheck = new Map<string, string[]>()
    for (const v of violations) {
      const msgs = byCheck.get(v.check) ?? []
      msgs.push(v.message)
      byCheck.set(v.check, msgs)
    }

    if (json) {
      stdout.write(
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
        ) + '\n'
      )
    } else {
      const lines: string[] = [
        violations.length === 0
          ? `BACKLOG.md lint — clean: all ${CHECKS.length} checks pass (${items.length} items).`
          : `BACKLOG.md lint — ${violations.length} violation(s) across ${items.length} item(s).`,
        '',
      ]
      for (const c of CHECKS) {
        const msgs = byCheck.get(c.key) ?? []
        lines.push(`${msgs.length === 0 ? '✓' : '✗'} ${c.label}`)
        for (const m of msgs) lines.push(`    ${m}`)
      }
      if (violations.length > 0) {
        lines.push('', 'Fix these in BACKLOG.md (or the journal), then re-run.')
      }
      stdout.write(lines.join('\n') + '\n')
    }

    return violations.length === 0 ? 0 : 1
  },
}
