import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The intent queue — the heart of how a delto GUI stays honest. A delto GUI never edits
 * `BACKLOG.md` itself; the agent owns that file so it keeps its working context. Instead a
 * GUI *records intent* — "promote ∆x", "split this", "draft a retro from these entries" —
 * by appending to this `.gitignore`d JSONL ledger beside the backlog. The agent drains the
 * queue and makes the edits, exactly the way difit hands review comments back to the agent.
 */

export interface Intent {
  /** What the human wants the agent to do (e.g. `promote`, `split`, `plan`, `new-item`). */
  kind: string
  /** The deltoid this intent is about, when it targets a specific item. */
  deltoid?: string
  /** Free-text note for the agent — the actual ask, in the human's words. */
  note?: string
  /** Arbitrary extra fields a mockup wants to pass through to the agent. */
  [key: string]: unknown
}

export interface RecordedIntent extends Intent {
  /** ISO-8601 timestamp the intent was recorded. */
  ts: string
  /** Monotonic id within the file (its line number, 1-based). */
  seq: number
  /** Set once the agent has acted on it (a later `resolve` record flips this). */
  resolved: boolean
}

export function intentsFile(repoRoot: string): string {
  return join(repoRoot, '.delto-gui-intents.local.jsonl')
}

/** Append a new intent, stamped with the server clock, and return the recorded form. */
export function recordIntent(repoRoot: string, intent: Intent): RecordedIntent {
  const ts = new Date().toISOString()
  appendFileSync(intentsFile(repoRoot), JSON.stringify({ ...intent, ts }) + '\n')
  return readIntents(repoRoot).at(-1)!
}

/** Mark an intent resolved (the agent acted on it) by appending a resolve record. */
export function resolveIntent(repoRoot: string, seq: number): void {
  appendFileSync(
    intentsFile(repoRoot),
    JSON.stringify({ kind: '__resolve', seq, ts: new Date().toISOString() }) + '\n'
  )
}

/** Read the queue, folding in `__resolve` records so each intent knows if it's done. */
export function readIntents(repoRoot: string): RecordedIntent[] {
  const file = intentsFile(repoRoot)
  if (!existsSync(file)) return []
  const resolved = new Set<number>()
  const recorded: RecordedIntent[] = []
  let seq = 0
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      continue
    }
    if (parsed.kind === '__resolve') {
      if (typeof parsed.seq === 'number') resolved.add(parsed.seq)
      continue
    }
    seq++
    recorded.push({ ...(parsed as Intent), ts: String(parsed.ts ?? ''), seq, resolved: false })
  }
  for (const intent of recorded) intent.resolved = resolved.has(intent.seq)
  return recorded
}
