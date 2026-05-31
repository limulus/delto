import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { type Subcommand } from './delto.ts'
import { requireRepoRoot } from './preconditions.ts'
import { cwd, err, out } from '../lib/io.ts'
import { mint as mintIds, takenIds } from '../lib/mint.ts'

const HELP = `delto mint — mint collision-free deltoid IDs

Usage: delto mint --journal-dir <dir> [--count <n>]

Scans the nearest BACKLOG.md (found by walking up from the current directory) and
every file in <dir> for the ∆ ids already in use, then prints fresh ones — one ∆xxx
per line and nothing else, so the output can be consumed directly.

Options:
  --journal-dir <dir>  Directory of completed journal entries to scan for past ids,
                       relative to the current directory (required).
  --count <n>          How many ids to mint (default: 1).
  -h, --help           Show this help.
`

export const mint: Subcommand = {
  name: 'mint',
  summary: 'mint collision-free deltoid IDs',
  async run(argv, opts) {
    const stdout = out(opts)
    const stderr = err(opts)

    let journalDir: string | undefined
    let countRaw: string | undefined
    let help = false
    try {
      const { values } = parseArgs({
        args: argv,
        options: {
          'journal-dir': { type: 'string' },
          count: { type: 'string' },
          help: { type: 'boolean', short: 'h' },
        },
        strict: true,
      })
      journalDir = values['journal-dir']
      countRaw = values.count
      help = values.help ?? false
    } catch (error) {
      stderr.write(`delto mint: ${(error as Error).message}\n`)
      return 1
    }

    if (help) {
      stdout.write(HELP)
      return 0
    }

    if (!journalDir) {
      stderr.write('delto mint: --journal-dir <dir> is required.\n')
      return 1
    }

    let count = 1
    if (countRaw !== undefined) {
      if (!/^[0-9]+$/.test(countRaw) || Number(countRaw) < 1) {
        stderr.write(
          `delto mint: --count must be a positive integer (got: ${JSON.stringify(countRaw)}).\n`
        )
        return 1
      }
      count = Number(countRaw)
    }

    const dir = cwd(opts)
    const root = requireRepoRoot(dir, stderr, 'mint')
    if (root === null) return 1

    const taken = await takenIds(join(root, 'BACKLOG.md'), resolve(dir, journalDir))
    let ids: string[]
    try {
      ids = mintIds(count, taken)
    } catch (error) {
      stderr.write(`delto mint: ${(error as Error).message}\n`)
      return 1
    }
    for (const id of ids) stdout.write(`∆${id}\n`)
    return 0
  },
}
