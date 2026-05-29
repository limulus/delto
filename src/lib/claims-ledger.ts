import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * The append-only claim ledger for a repo — a `.gitignore`d JSONL file beside BACKLOG.md
 * that records which items are in-flight. Append-only, last record per id wins, so a
 * claim and its later release coexist; a release for an unclaimed id is a harmless no-op.
 */
export function claimsFile(repoRoot: string): string {
  return join(repoRoot, '.delto-claims.local.jsonl')
}

/** The set of currently-claimed ids (last record per id wins). */
export function claimedIds(repoRoot: string): Set<string> {
  const file = claimsFile(repoRoot)
  const state = new Map<string, boolean>()
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const record = JSON.parse(trimmed)
        if (typeof record.id === 'string') state.set(record.id, record.released !== true)
      } catch {
        // skip malformed lines
      }
    }
  }
  const claimed = new Set<string>()
  for (const [id, isClaimed] of state) {
    if (isClaimed) claimed.add(id)
  }
  return claimed
}

function appendLedger(repoRoot: string, record: Record<string, unknown>): void {
  const file = claimsFile(repoRoot)
  mkdirSync(dirname(file), { recursive: true })
  appendFileSync(file, JSON.stringify(record) + '\n')
}

/** Record a task as in-flight. */
export function claim(repoRoot: string, id: string): void {
  appendLedger(repoRoot, { id })
}

/** Record the end of a task's claim — abandoned planning, or the task shipped. */
export function release(repoRoot: string, id: string): void {
  appendLedger(repoRoot, { id, released: true })
}
