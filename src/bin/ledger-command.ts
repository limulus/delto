import { relative } from 'node:path'
import { parseArgs } from 'node:util'

import { type Subcommand } from './delto.ts'
import { cwd, err, out } from './io.ts'
import { findRepoRoot, ID } from '../lib/backlog.ts'
import { claimsFile } from '../lib/claims-ledger.ts'

export interface LedgerCommandSpec {
  name: string
  summary: string
  help: string
  /** Mutate the ledger for `id` under `repoRoot` (claim or release). */
  apply: (repoRoot: string, id: string) => void
  /** The success line(s) to print, given the id and the ledger's repo-relative path. */
  done: (id: string, ledgerPath: string) => string
}

/**
 * Builds a `claim`/`release` subcommand. Both take a single `<deltoid>` positional,
 * resolve the nearest BACKLOG.md, append one record to the ledger beside it, and report
 * what happened — differing only in which record they append and what they print.
 */
export function ledgerCommand(spec: LedgerCommandSpec): Subcommand {
  return {
    name: spec.name,
    summary: spec.summary,
    async run(argv, opts) {
      const stdout = out(opts)
      const stderr = err(opts)

      let positionals: string[] = []
      let help = false
      try {
        const parsed = parseArgs({
          args: argv,
          options: { help: { type: 'boolean', short: 'h' } },
          allowPositionals: true,
          strict: true,
        })
        positionals = parsed.positionals
        help = parsed.values.help ?? false
      } catch (error) {
        stderr.write(`delto ${spec.name}: ${(error as Error).message}\n`)
        return 1
      }

      if (help) {
        stdout.write(spec.help)
        return 0
      }

      if (positionals.length === 0) {
        stderr.write(`delto ${spec.name}: a <deltoid> is required.\n`)
        return 1
      }
      if (positionals.length > 1) {
        stderr.write(`delto ${spec.name}: only one <deltoid> may be given.\n`)
        return 1
      }

      const raw = positionals[0]
      const id = raw.replace(/^∆/, '')
      if (!new RegExp(`^${ID}$`).test(id)) {
        stderr.write(
          `delto ${spec.name}: '${raw}' is not a valid deltoid (∆ followed by 3 alphanumerics).\n`
        )
        return 1
      }

      const root = findRepoRoot(cwd(opts))
      if (!root) {
        stderr.write(
          `delto ${spec.name}: no BACKLOG.md found in the current directory or any parent.\n`
        )
        return 1
      }

      spec.apply(root, id)
      stdout.write(spec.done(id, relative(root, claimsFile(root))) + '\n')
      return 0
    },
  }
}
