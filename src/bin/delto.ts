/**
 * delto.ts
 *
 * The `@limulus/delto` CLI dispatcher. Routes subcommands to the individual scripts so a
 * single bin entry — `npx @limulus/delto <command>` — can drive every backlog skill. The
 * runner that turns this into a process lives next to it in `cli.ts` so this file stays
 * free of side effects and is unit-testable.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { main as completeItem } from './complete-item.ts'
import { main as findEligibleTasks } from './find-eligible-tasks.ts'
import { main as lintBacklog } from './lint-backlog.ts'
import { type MainOpts, defaults } from './main.ts'
import { main as mintId } from './mint-id.ts'
import { main as reportStatus } from './report-status.ts'
import { RepoRootNotFoundError } from '../lib/backlog-parser.ts'

type Subcommand = (argv: string[], opts: MainOpts) => number

export interface CommandEntry {
  names: string[]
  summary: string
  run: Subcommand
}

export const COMMANDS: CommandEntry[] = [
  {
    names: ['mint', 'add'],
    summary: 'Mint fresh ∆xxx backlog IDs (one per line). --count N for N distinct IDs.',
    run: mintId,
  },
  {
    names: ['plan'],
    summary:
      'List BACKLOG.md task IDs free to plan now. --json | --claim <id> | --release <id>.',
    run: findEligibleTasks,
  },
  {
    names: ['complete'],
    summary:
      'Run the `## Committing` ritual for a finished item. <id> [--slug] [--title] [--dry-run].',
    run: completeItem,
  },
  {
    names: ['refine', 'lint'],
    summary: 'Check BACKLOG.md structural integrity. --json for machine-readable output.',
    run: lintBacklog,
  },
  {
    names: ['status'],
    summary: 'Print a progress report over BACKLOG.md. --json for machine-readable output.',
    run: reportStatus,
  },
]

function usage(log: (line: string) => void, commands: CommandEntry[]): void {
  log('Usage: delto <command> [...args]')
  log('')
  log('Commands:')
  const width = Math.max(...commands.map((c) => c.names.join(', ').length))
  for (const c of commands) {
    log('  ' + c.names.join(', ').padEnd(width) + '  ' + c.summary)
  }
  log('')
  log('Run `delto <command> --help` for command-specific options (where supported).')
}

export interface DispatcherOpts extends MainOpts {
  commands?: CommandEntry[]
}

export function main(argv: string[], opts: DispatcherOpts = {}): number {
  const { log, err } = defaults(opts)
  const commands = opts.commands ?? COMMANDS
  const [command, ...rest] = argv
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    usage(log, commands)
    return command ? 0 : 1
  }
  if (command === '--version' || command === '-v') {
    log(readVersion())
    return 0
  }
  const entry = commands.find((c) => c.names.includes(command))
  if (!entry) {
    err(`delto: unknown command "${command}"`)
    err('')
    usage(err, commands)
    return 1
  }
  try {
    return entry.run(rest, opts)
  } catch (e) {
    if (e instanceof RepoRootNotFoundError) {
      err(`delto: ${e.message}`)
      return 1
    }
    throw e
  }
}

/** Walk up from `startDir` to the nearest package.json whose name is `@limulus/delto`. */
export function readVersion(
  startDir: string = dirname(fileURLToPath(import.meta.url))
): string {
  let dir = startDir
  for (;;) {
    const candidate = dir + '/package.json'
    if (existsSync(candidate)) {
      const pkg = JSON.parse(readFileSync(candidate, 'utf8'))
      if (pkg.name === '@limulus/delto') return String(pkg.version)
    }
    const parent = dirname(dir)
    if (parent === dir) return 'unknown'
    dir = parent
  }
}
