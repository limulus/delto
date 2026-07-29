import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { type Subcommand } from './delto.ts'
import { findRepoRoot } from '../lib/backlog.ts'
import { ensureClaimLedgerIgnored } from '../lib/gitignore.ts'
import { cwd, err, out } from '../lib/io.ts'
import { formatCompleted } from '../lib/journal.ts'
import { renderBacklog } from '../lib/templates/backlog.ts'
import { renderJournalReadme } from '../lib/templates/journal-readme.ts'

const HELP = `delto bootstrap — set up delto in a fresh project

Usage: delto bootstrap [--journal-dir <dir>]

Materializes delto's starter files into the current directory: a BACKLOG.md whose
header documents the backlog conventions, a journal README seeding the distillation
watermark, and a .gitignore entry keeping the claim ledger out of version control.
Refuses to run where a BACKLOG.md already exists; other files that are already
present are left untouched.

Options:
  --journal-dir <dir>  Directory for completed-work journal entries, relative to the
                       current directory (default: docs/journal).
  -h, --help           Show this help.
`

export const bootstrap: Subcommand = {
  name: 'bootstrap',
  summary: 'set up delto in a fresh project',
  async run(argv, opts) {
    const stdout = out(opts)
    const stderr = err(opts)

    let journalDirRaw: string | undefined
    let help = false
    try {
      const { values } = parseArgs({
        args: argv,
        options: {
          'journal-dir': { type: 'string' },
          help: { type: 'boolean', short: 'h' },
        },
        strict: true,
      })
      journalDirRaw = values['journal-dir']
      help = values.help ?? false
    } catch (error) {
      stderr.write(`delto bootstrap: ${(error as Error).message}\n`)
      return 1
    }

    if (help) {
      stdout.write(HELP)
      return 0
    }

    // The value is embedded verbatim in the rendered templates, so normalize away a
    // trailing slash to keep `docs/journal//∆*.md`-style paths out of consumer docs.
    const journalDir = (journalDirRaw ?? 'docs/journal').replace(/\/+$/, '')
    if (journalDir === '') {
      stderr.write('delto bootstrap: --journal-dir must not be empty.\n')
      return 1
    }

    const dir = cwd(opts)
    // Check the current directory before the walk-up: findRepoRoot matches cwd's own
    // BACKLOG.md too, so inverting these turns every refusal into a warning.
    if (existsSync(join(dir, 'BACKLOG.md'))) {
      stderr.write('delto bootstrap: BACKLOG.md already exists — refusing to overwrite.\n')
      return 1
    }
    const ancestorRoot = findRepoRoot(dir)
    if (ancestorRoot !== undefined) {
      stderr.write(
        `delto bootstrap: an ancestor directory has a BACKLOG.md (${ancestorRoot}) — bootstrapping a nested backlog here.\n`
      )
    }

    const written: string[] = []

    writeFileSync(join(dir, 'BACKLOG.md'), renderBacklog({ journalDir }))
    written.push('wrote BACKLOG.md')

    const journalTarget = resolve(dir, journalDir)
    const readmeTarget = join(journalTarget, 'README.md')
    if (existsSync(readmeTarget)) {
      stderr.write(
        `delto bootstrap: ${journalDir}/README.md already exists — leaving it untouched.\n`
      )
    } else {
      mkdirSync(journalTarget, { recursive: true })
      writeFileSync(
        readmeTarget,
        renderJournalReadme({ journalDir, distilledAt: formatCompleted(new Date()) })
      )
      written.push(`wrote ${journalDir}/README.md`)
    }

    const gitignoreTarget = join(dir, '.gitignore')
    const existing = existsSync(gitignoreTarget)
      ? readFileSync(gitignoreTarget, 'utf8')
      : undefined
    const content = ensureClaimLedgerIgnored(existing)
    if (content !== null) {
      writeFileSync(gitignoreTarget, content)
      written.push(existing === undefined ? 'wrote .gitignore' : 'updated .gitignore')
    }

    stdout.write(`Bootstrapped delto in ${dir}:\n`)
    for (const entry of written) stdout.write(`  • ${entry}\n`)
    stdout.write(
      `Next: install the /delto skill (\`npx skills add limulus/delto\`) and mint your first item with \`npx @limulus/delto@1 mint --journal-dir ${journalDir}\`.\n`
    )
    return 0
  },
}
