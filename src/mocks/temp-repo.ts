import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach } from 'vitest'

export interface TempRepo {
  /** The throwaway directory standing in for a project root. */
  readonly dir: string
  /** Write BACKLOG.md at the repo root with the given body. */
  writeBacklog(body: string): void
  /** Join path segments onto the repo dir (does not create anything). */
  path(...segments: string[]): string
}

/**
 * A throwaway project directory, created fresh before each test and removed after — a real
 * filesystem fixture, no mocks. It does NOT seed a BACKLOG.md: call `writeBacklog` when a
 * test needs one, and omit it to exercise the "no BACKLOG.md found" path.
 */
export function useTempRepo(prefix = 'delto-test-'): TempRepo {
  const state = { dir: '' }
  beforeEach(() => {
    state.dir = mkdtempSync(join(tmpdir(), prefix))
  })
  afterEach(() => {
    rmSync(state.dir, { recursive: true, force: true })
  })
  return {
    get dir() {
      return state.dir
    },
    writeBacklog(body) {
      writeFileSync(join(state.dir, 'BACKLOG.md'), body)
    },
    path(...segments) {
      return join(state.dir, ...segments)
    },
  }
}
