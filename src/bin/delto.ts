import { parseArgs } from 'node:util'

import { err, out } from './io.ts'
import { mint } from './mint.ts'

export interface OutputStream {
  write(chunk: string): unknown
}

export interface Subcommand {
  name: string
  summary: string
  run(argv: string[], opts: RunOptions): Promise<number>
}

export interface RunOptions {
  stdout?: OutputStream
  stderr?: OutputStream
  subcommands?: Subcommand[]
  /** Directory to resolve the nearest BACKLOG.md from. Defaults to `process.cwd()`. */
  cwd?: string
}

const SUBCOMMANDS: Subcommand[] = [mint]

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

export async function run(argv: string[], opts: RunOptions = {}): Promise<number> {
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
  } catch (err) {
    stderr.write(`delto: ${(err as Error).message}\n`)
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
