import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { bootstrap } from './bootstrap.ts'
import { Capture } from '../mocks/capture.ts'
import { useTempRepo } from '../mocks/temp-repo.ts'

describe('delto bootstrap', () => {
  const repo = useTempRepo('delto-bootstrap-')

  const runBootstrap = async (argv: string[] = [], cwd?: string) => {
    const stdout = new Capture()
    const stderr = new Capture()
    const code = await bootstrap.run(argv, { stdout, stderr, cwd: cwd ?? repo.dir })
    return { code, stdout, stderr }
  }

  it('prints help and exits 0 on --help', async () => {
    const { code, stdout, stderr } = await runBootstrap(['--help'])
    expect(code).toBe(0)
    expect(stdout.text).toContain('Usage: delto bootstrap')
    expect(stdout.text).toContain('--journal-dir')
    expect(stdout.text).toContain('docs/journal')
    expect(stderr.text).toBe('')
  })

  it('errors on an unknown flag', async () => {
    const { code, stderr } = await runBootstrap(['--bogus'])
    expect(code).toBe(1)
    expect(stderr.text).toContain('delto bootstrap: ')
    expect(stderr.text).toContain('--bogus')
  })

  it('errors on a stray positional argument', async () => {
    const { code, stderr } = await runBootstrap(['extra'])
    expect(code).toBe(1)
    expect(stderr.text).toContain('delto bootstrap: ')
  })

  it('errors when --journal-dir is empty', async () => {
    const { code, stderr } = await runBootstrap(['--journal-dir', ''])
    expect(code).toBe(1)
    expect(stderr.text).toContain('must not be empty')
  })

  it('refuses to overwrite an existing BACKLOG.md, touching nothing', async () => {
    repo.writeBacklog('# Existing\n')
    const { code, stderr } = await runBootstrap()
    expect(code).toBe(1)
    expect(stderr.text).toBe(
      'delto bootstrap: BACKLOG.md already exists — refusing to overwrite.\n'
    )
    expect(readFileSync(repo.path('BACKLOG.md'), 'utf8')).toBe('# Existing\n')
    expect(existsSync(repo.path('docs'))).toBe(false)
    expect(existsSync(repo.path('.gitignore'))).toBe(false)
  })

  it('materializes all three artifacts in a fresh directory', async () => {
    const { code, stdout, stderr } = await runBootstrap()
    expect(code).toBe(0)
    const backlog = readFileSync(repo.path('BACKLOG.md'), 'utf8')
    expect(backlog).toContain('managed with the **delto** skill')
    expect(backlog).toContain('--journal-dir docs/journal')
    const readme = readFileSync(repo.path('docs', 'journal', 'README.md'), 'utf8')
    expect(readme).toMatch(
      /\*\*Last distilled: \d{4}-\d\d-\d\d \d\d:\d\d:\d\d [+-]\d\d:\d\d\.\*\*/
    )
    const gitignore = readFileSync(repo.path('.gitignore'), 'utf8')
    expect(gitignore).toContain('# Delto plan-backlog-item claim ledger')
    expect(gitignore).toContain('.delto-claims.local.jsonl')
    expect(stdout.text).toContain(`Bootstrapped delto in ${repo.dir}:`)
    expect(stdout.text).toContain('  • wrote BACKLOG.md\n')
    expect(stdout.text).toContain('  • wrote docs/journal/README.md\n')
    expect(stdout.text).toContain('  • wrote .gitignore\n')
    expect(stdout.text).toContain('Next: ')
    expect(stdout.text).toContain('npx skills add limulus/delto')
    expect(stdout.text).toContain('mint --journal-dir docs/journal')
    expect(stderr.text).toBe('')
  })

  it('honors a custom nested --journal-dir', async () => {
    const { code, stdout } = await runBootstrap(['--journal-dir', 'notes/log'])
    expect(code).toBe(0)
    const readme = readFileSync(repo.path('notes', 'log', 'README.md'), 'utf8')
    expect(readme).toContain("grep -H '^completed:' notes/log/∆*.md")
    expect(readFileSync(repo.path('BACKLOG.md'), 'utf8')).toContain(
      '--journal-dir notes/log'
    )
    expect(stdout.text).toContain('  • wrote notes/log/README.md\n')
  })

  it('normalizes a trailing slash on --journal-dir', async () => {
    const { code } = await runBootstrap(['--journal-dir', 'docs/journal/'])
    expect(code).toBe(0)
    expect(existsSync(repo.path('docs', 'journal', 'README.md'))).toBe(true)
    const backlog = readFileSync(repo.path('BACKLOG.md'), 'utf8')
    expect(backlog).toContain('--journal-dir docs/journal')
    expect(backlog).not.toContain('docs/journal//')
    const readme = readFileSync(repo.path('docs', 'journal', 'README.md'), 'utf8')
    expect(readme).not.toContain('docs/journal//')
  })

  it('leaves an existing journal README untouched', async () => {
    mkdirSync(repo.path('docs', 'journal'), { recursive: true })
    writeFileSync(repo.path('docs', 'journal', 'README.md'), 'mine\n')
    const { code, stdout, stderr } = await runBootstrap()
    expect(code).toBe(0)
    expect(readFileSync(repo.path('docs', 'journal', 'README.md'), 'utf8')).toBe('mine\n')
    expect(stderr.text).toContain(
      'docs/journal/README.md already exists — leaving it untouched.'
    )
    expect(stdout.text).not.toContain('wrote docs/journal/README.md')
    expect(stdout.text).toContain('  • wrote BACKLOG.md\n')
  })

  it('appends to an existing .gitignore missing a trailing newline', async () => {
    writeFileSync(repo.path('.gitignore'), 'node_modules/')
    const { code, stdout } = await runBootstrap()
    expect(code).toBe(0)
    const gitignore = readFileSync(repo.path('.gitignore'), 'utf8')
    expect(gitignore).toContain('node_modules/\n')
    expect(gitignore).toContain('.delto-claims.local.jsonl\n')
    expect(stdout.text).toContain('  • updated .gitignore\n')
    expect(stdout.text).not.toContain('  • wrote .gitignore\n')
  })

  it('leaves a .gitignore that already covers the ledger untouched', async () => {
    writeFileSync(repo.path('.gitignore'), '.delto-claims.local.jsonl\n')
    const { code, stdout } = await runBootstrap()
    expect(code).toBe(0)
    expect(readFileSync(repo.path('.gitignore'), 'utf8')).toBe(
      '.delto-claims.local.jsonl\n'
    )
    expect(stdout.text).not.toContain('.gitignore')
  })

  it('warns but proceeds when an ancestor directory has a BACKLOG.md', async () => {
    repo.writeBacklog('# Parent backlog\n')
    const nested = repo.path('packages', 'app')
    mkdirSync(nested, { recursive: true })
    const { code, stderr } = await runBootstrap([], nested)
    expect(code).toBe(0)
    expect(stderr.text).toContain('ancestor')
    expect(existsSync(repo.path('packages', 'app', 'BACKLOG.md'))).toBe(true)
    expect(existsSync(repo.path('packages', 'app', 'docs', 'journal', 'README.md'))).toBe(
      true
    )
    expect(existsSync(repo.path('packages', 'app', '.gitignore'))).toBe(true)
  })
})
