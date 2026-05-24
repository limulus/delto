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

import { findRepoRoot } from './backlog-parser.ts'

/** The append-only claim ledger — `.gitignore`'d, owned by the plan-backlog-item skill. */
export const CLAIMS_FILE = join(
  findRepoRoot(),
  '.claude',
  'skills',
  'plan-backlog-item',
  'claims.local.jsonl',
)

/** The set of currently-claimed IDs (append-only ledger, last record per ID wins). */
export function claimedIds(): Set<string> {
  const state = new Map<string, boolean>()
  if (existsSync(CLAIMS_FILE)) {
    for (const line of readFileSync(CLAIMS_FILE, 'utf8').split('\n')) {
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
export function appendLedger(record: Record<string, unknown>): void {
  mkdirSync(dirname(CLAIMS_FILE), { recursive: true })
  appendFileSync(CLAIMS_FILE, JSON.stringify(record) + '\n')
}

/** Record a task as in-flight. */
export function claim(id: string): void {
  appendLedger({ id })
}

/** Record the end of a task's claim — abandoned planning, or the task shipped. */
export function release(id: string): void {
  appendLedger({ id, released: true })
}
