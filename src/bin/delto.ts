import { parseArgs } from 'node:util'

import { claim } from './claim.ts'
import { complete } from './complete.ts'
import { mint } from './mint.ts'
import { release } from './release.ts'
import { surface } from './surface.ts'
import { err, out, type RunOptions } from '../lib/io.ts'

export interface Subcommand {
  name: string
  summary: string
  run(argv: string[], opts: RunOptions): Promise<number>
}

export interface RouterOptions extends RunOptions {
  subcommands?: Subcommand[]
}

const SUBCOMMANDS: Subcommand[] = [mint, surface, claim, release, complete]

function helpText(subcommands: Subcommand[]): string {
  const subList =
    subcommands.length === 0
      ? '  (none wired yet)'
      : subcommands.map((s) => `  ${s.name.padEnd(12)}${s.summary}`).join('\n')
  return `delto — Keep a backlog. With your code. Give agents context.

Usage: delto <subcommand> [options]

Subcommands:
${subList}

Run \`delto <subcommand> --help\` for per-subcommand usage.
`
}

export async function run(argv: string[], opts: RouterOptions = {}): Promise<number> {
  const stdout = out(opts)
  const stderr = err(opts)
  const subcommands = opts.subcommands ?? SUBCOMMANDS

  // Router flags live before the subcommand name. Parse only that prefix so
  // unknown subcommand-level flags don't trip strict-mode validation here.
  const subIdx = argv.findIndex((a) => !a.startsWith('-'))
  const routerArgs = subIdx === -1 ? argv : argv.slice(0, subIdx)

  let help = false
  try {
    const parsed = parseArgs({
      args: routerArgs,
      options: { help: { type: 'boolean', short: 'h' } },
      strict: true,
    })
    help = parsed.values.help ?? false
  } catch (error) {
    stderr.write(`delto: ${(error as Error).message}\n`)
    stderr.write('Run `delto --help` for usage.\n')
    return 1
  }

  if (subIdx === -1 || help) {
    stdout.write(helpText(subcommands))
    return 0
  }

  const subName = argv[subIdx]
  const sub = subcommands.find((s) => s.name === subName)
  if (sub) {
    return await sub.run(argv.slice(subIdx + 1), opts)
  }

  stderr.write(`delto: unknown subcommand: '${subName}'\n`)
  stderr.write('Run `delto --help` for usage.\n')
  return 1
}
