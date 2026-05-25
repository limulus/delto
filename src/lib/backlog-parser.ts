/**
 * backlog-parser.ts
 *
 * Shared BACKLOG.md parsing for the backlog-tooling skills. `find-eligible-tasks.ts`
 * (plan-backlog-item) and `lint-backlog.ts` (refine-backlog) both build on this so the
 * notion of "an item" — its ID, its `needs:`/`touches:` suffixes, the lines it spans —
 * stays defined in exactly one place.
 *
 * Runs on Node's built-in TypeScript type-stripping — no build step, no flag. Keep this
 * file to erasable-only syntax (no enums, namespaces, or parameter properties).
 */

import { findUpSync } from 'find-up-simple'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** 3-char alphanumeric ID body, as defined by the BACKLOG.md header. */
export const ID = '[A-Za-z0-9]{3}'

/** A heading's text and the 1-based line it sits on in BACKLOG.md. */
export interface HeadingRef {
  text: string
  line: number
}

export interface BacklogItem {
  id: string
  needs: string[]
  touches: string[]
  /** 1-based line number of the `- ∆xxx …` line in BACKLOG.md. */
  lineStart: number
  /** Source lines the item spans, counting wrapped continuation lines. */
  lineCount: number
  /** The `##` initiative the item lives under — always set in a well-formed file. */
  initiativeHeading: HeadingRef | null
  /** The `###` epic the item lives under, or null when the item sits directly under
   *  the initiative (e.g. the flat `## Refactors` list has no epics). */
  epicHeading: HeadingRef | null
}

/** Walk up from `start` to the directory that holds BACKLOG.md. */
export function findRepoRoot(start: string = process.cwd()): string {
  const backlog = findUpSync('BACKLOG.md', { cwd: start })
  if (!backlog) {
    console.error('backlog-parser: no BACKLOG.md found in any parent directory.')
    process.exit(1)
  }
  return dirname(backlog)
}

/** Extract the `∆xxx` IDs from a `; <label>: ∆a, ∆b` dependency suffix. */
export function suffixIds(body: string, label: string): string[] {
  const m = new RegExp(`;\\s*${label}:\\s*([^;]*)`).exec(body)
  if (!m) return []
  const ids: string[] = []
  const re = new RegExp(`∆(${ID})`, 'g')
  let x: RegExpExecArray | null
  while ((x = re.exec(m[1])) !== null) ids.push(x[1])
  return ids
}

/** Parse BACKLOG.md items in document order (which is priority order). */
export function parseBacklog(repoRoot: string): BacklogItem[] {
  const items: BacklogItem[] = []
  const itemStart = new RegExp(`^- ∆(${ID}) (.*)$`)
  const headingStart = /^(#+)\s+(.*\S)\s*$/
  let id = ''
  let body = ''
  let lineStart = 0
  let lineCount = 0
  let initiativeHeading: HeadingRef | null = null
  let epicHeading: HeadingRef | null = null
  const flush = (): void => {
    if (id) {
      items.push({
        id,
        needs: suffixIds(body, 'needs'),
        touches: suffixIds(body, 'touches'),
        lineStart,
        lineCount,
        initiativeHeading,
        epicHeading,
      })
    }
    id = ''
    body = ''
    lineStart = 0
    lineCount = 0
  }
  const lines = readFileSync(join(repoRoot, 'BACKLOG.md'), 'utf8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('#')) {
      flush()
      // Track heading context so each item knows its epic/initiative. `#` (title)
      // clears both; `##` opens an initiative and clears any epic; `###`+ opens an
      // epic. flush() ran first, so the item just closed keeps its prior context.
      const h = headingStart.exec(line)
      if (h) {
        const heading = { text: h[2], line: i + 1 }
        if (h[1].length === 1) {
          initiativeHeading = null
          epicHeading = null
        } else if (h[1].length === 2) {
          initiativeHeading = heading
          epicHeading = null
        } else {
          epicHeading = heading
        }
      }
      continue
    }
    const m = itemStart.exec(line)
    if (m) {
      flush()
      id = m[1]
      body = m[2]
      lineStart = i + 1
      lineCount = 1
      continue
    }
    // A wrapped item continues on every non-blank line until the next item,
    // heading, or blank line. Continuation is detected by those boundaries, not
    // by indentation: an auto-formatter may de-indent a wrapped line to column
    // 0, and keying off leading whitespace would then silently drop the rest of
    // the item — including any trailing `needs:`/`touches:` suffix.
    if (id && line.trim() !== '') {
      body += ' ' + line.trim()
      lineCount++
      continue
    }
    flush()
  }
  flush()
  return items
}

/**
 * The IDs of completed items — one per `docs/journal/∆xxx-slug.md` entry. A `needs:` or
 * `touches:` ref resolves to a real item when it names a live BACKLOG ID or one of these.
 */
export function journalIds(repoRoot: string): Set<string> {
  const ids = new Set<string>()
  const dir = join(repoRoot, 'docs', 'journal')
  if (!existsSync(dir)) return ids
  const entry = new RegExp(`^∆(${ID})-.*\\.md$`)
  for (const name of readdirSync(dir)) {
    const m = entry.exec(name)
    if (m) ids.add(m[1])
  }
  return ids
}
