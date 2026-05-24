/**
 * Shared test fixtures: a throwaway repo on disk with a minimal BACKLOG.md, and small
 * capture sinks for the bin scripts' log/err output. Lives under `src/mocks/`, which
 * `vitest.config.ts` excludes from coverage — test scaffolding shouldn't count toward
 * the 100% threshold.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface TestRepo {
  root: string
  writeBacklog: (body: string) => void
  writeJournal: (filename: string, body?: string) => void
  cleanup: () => void
}

export function makeRepo(initialBacklog: string = '# BACKLOG\n'): TestRepo {
  const root = mkdtempSync(join(tmpdir(), 'delto-test-'))
  const writeBacklog = (body: string): void => {
    writeFileSync(join(root, 'BACKLOG.md'), body)
  }
  writeBacklog(initialBacklog)
  const writeJournal = (filename: string, body: string = ''): void => {
    const dir = join(root, 'docs', 'journal')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, filename), body)
  }
  const cleanup = (): void => {
    rmSync(root, { recursive: true, force: true })
  }
  return { root, writeBacklog, writeJournal, cleanup }
}

export interface CaptureSink {
  log: (line: string) => void
  err: (line: string) => void
  out: string[]
  errs: string[]
}

export function capture(): CaptureSink {
  const out: string[] = []
  const errs: string[] = []
  return {
    out,
    errs,
    log: (line: string) => out.push(line),
    err: (line: string) => errs.push(line),
  }
}
