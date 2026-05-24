/**
 * claims-ledger.ts
 *
 * Shared access to the plan-backlog-item claim ledger — the append-only JSONL file
 * that records which BACKLOG.md tasks are in-flight. `find-eligible-tasks.ts`
 * (plan-backlog-item) reads it to exclude claimed tasks and writes claim/release
 * records; `complete-item.ts` (complete-backlog-item) appends a release record when a
 * task ships. Keeping the file's path and record format in one place means both skills
 * agree on what a claim is.
 *
 * The ledger is append-only and the last record per ID wins, so a claim and its later
 * release coexist in the file. A release for an ID that was never claimed is harmless —
 * it just resolves to "not claimed".
 *
 * Runs on Node's built-in TypeScript type-stripping — no build step, no flag. Keep this
 * file to erasable-only syntax (no enums, namespaces, or parameter properties).
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** Compute the path to the append-only claim ledger for the given repo root. */
export function claimsFile(repoRoot: string): string {
  return join(repoRoot, '.claude', 'skills', 'plan-backlog-item', 'claims.local.jsonl')
}

/** The set of currently-claimed IDs (append-only ledger, last record per ID wins). */
export function claimedIds(repoRoot: string): Set<string> {
  const state = new Map<string, boolean>()
  const file = claimsFile(repoRoot)
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const t = line.trim()
      if (!t) continue
      try {
        const c = JSON.parse(t)
        if (typeof c.id === 'string') state.set(c.id, c.released !== true)
      } catch {
        // skip malformed lines
      }
    }
  }
  const set = new Set<string>()
  for (const [id, claimed] of state) {
    if (claimed) set.add(id)
  }
  return set
}

/** Append a raw record to the ledger, creating the file and its directory if needed. */
export function appendLedger(repoRoot: string, record: Record<string, unknown>): void {
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
