/**
 * delto.ts
 *
 * The `@limulus/delto` CLI dispatcher. Routes subcommands to the individual scripts so a
 * single bin entry — `npx @limulus/delto <command>` — can drive every backlog skill. The
 * runner that turns this into a process lives next to it in `cli.ts` so this file stays
 * free of side effects and is unit-testable.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
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

export const COMMANDS: readonly CommandEntry[] = [
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

function usage(out: (line: string) => void, commands: readonly CommandEntry[]): void {
  out('Usage: delto <command> [...args]')
  out('')
  out('Commands:')
  const width = Math.max(0, ...commands.map((c) => c.names.join(', ').length))
  for (const c of commands) {
    out('  ' + c.names.join(', ').padEnd(width) + '  ' + c.summary)
  }
  out('')
  out('Global flags: --help, -h, help · --version, -v')
}

export interface DispatcherOpts extends MainOpts {
  commands?: readonly CommandEntry[]
}

const HELP_FLAGS = new Set(['--help', '-h', 'help'])
const VERSION_FLAGS = new Set(['--version', '-v'])

export function main(argv: string[], opts: DispatcherOpts = {}): number {
  const { log, err } = defaults(opts)
  const commands = opts.commands ?? COMMANDS

  // --help / --version are honoured at ANY position so `delto --help mint`,
  // `delto mint --help`, and `delto -v plan` all do the right thing instead of
  // silently dropping a token.
  if (argv.some((a) => HELP_FLAGS.has(a))) {
    usage(log, commands)
    return 0
  }
  if (argv.some((a) => VERSION_FLAGS.has(a))) {
    log(readVersion())
    return 0
  }

  if (argv.length === 0) {
    usage(err, commands)
    return 1
  }

  const [command, ...rest] = argv
  const entry = commands.find((c) => c.names.includes(command))
  if (!entry) {
    err(`delto: unknown command "${command}"`)
    err('')
    usage(err, commands)
    return 1
  }
  // Strip the dispatcher's own fields so subcommands see only what they expect.
  const { commands: _commands, ...rest_opts } = opts
  void _commands
  try {
    return entry.run(rest, rest_opts)
  } catch (e) {
    if (e instanceof RepoRootNotFoundError) {
      err(`delto: ${e.message}`)
      return 1
    }
    if (e instanceof Error) {
      err(`delto ${command}: ${e.message}`)
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
    const candidate = join(dir, 'package.json')
    if (existsSync(candidate)) {
      try {
        const pkg = JSON.parse(readFileSync(candidate, 'utf8'))
        if (pkg.name === '@limulus/delto') return String(pkg.version)
      } catch {
        // Skip an unreadable/malformed ancestor package.json and keep walking;
        // we only care about the one whose name matches.
      }
    }
    const parent = dirname(dir)
    if (parent === dir) return 'unknown'
    dir = parent
  }
}
