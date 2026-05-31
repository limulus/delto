import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { type Subcommand } from './delto.ts'
import { backlogLines, findRepoRoot, parseBacklog, parseDeltoid } from '../lib/backlog.ts'
import { release } from '../lib/claims-ledger.ts'
import { cwd, err, out } from '../lib/io.ts'
import { formatCompleted, journalEntry } from '../lib/journal.ts'

const HELP = `delto complete <deltoid> <journal-entry-path> — finish a backlog item

Usage: delto complete <deltoid> <journal-entry-path>

Scaffolds a journal entry at the given path — spec frontmatter (id + completed), the
item's bullet transcribed from the nearest BACKLOG.md, and TODO sections to fill in —
and releases the item's claim. Refuses to overwrite an existing file. It does not edit
BACKLOG.md: remove the item's bullet yourself, then commit. The ∆ sigil is optional.

By convention the path is docs/journal/∆<id>-<kebab-slug>.md, but any path works.

Options:
  -h, --help  Show this help.
`

export const complete: Subcommand = {
  name: 'complete',
  summary: 'release a claim and scaffold a journal entry for a finished item',
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
      stderr.write(`delto complete: ${(error as Error).message}\n`)
      return 1
    }

    if (help) {
      stdout.write(HELP)
      return 0
    }

    const [rawId, journalPath, ...rest] = positionals
    if (!rawId || !journalPath) {
      stderr.write('delto complete: usage: delto complete <deltoid> <journal-entry-path>\n')
      return 1
    }
    if (rest.length > 0) {
      stderr.write(
        'delto complete: too many arguments — expected <deltoid> <journal-entry-path>.\n'
      )
      return 1
    }

    const id = parseDeltoid(rawId)
    if (id === null) {
      stderr.write(
        `delto complete: '${rawId}' is not a valid deltoid (∆ followed by 3 alphanumerics).\n`
      )
      return 1
    }

    const dir = cwd(opts)
    const root = findRepoRoot(dir)
    if (!root) {
      stderr.write(
        'delto complete: no BACKLOG.md found in the current directory or any parent.\n'
      )
      return 1
    }

    const item = parseBacklog(root).find((x) => x.id === id)
    if (!item) {
      stderr.write(
        `delto complete: ∆${id} is not in BACKLOG.md — already completed, or wrong id.\n`
      )
      return 1
    }

    const target = resolve(dir, journalPath)
    if (existsSync(target)) {
      stderr.write(
        `delto complete: ${journalPath} already exists — refusing to overwrite.\n`
      )
      return 1
    }

    const lines = backlogLines(root)
    const bullet = lines.slice(item.lineStart - 1, item.lineStart - 1 + item.lineCount)

    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, journalEntry(id, bullet, formatCompleted(new Date())))
    release(root, id)

    stdout.write(`Completed ∆${id}:\n`)
    stdout.write(`  • wrote ${journalPath}\n`)
    stdout.write(`  • cleared any claim on ∆${id}\n`)
    stdout.write(
      `Next: fill in the journal's Planning/Refinement/Retrospective, remove ∆${id} from BACKLOG.md, and commit.\n`
    )
    return 0
  },
}
