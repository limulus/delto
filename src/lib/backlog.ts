import { findUpSync } from 'find-up-simple'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** The 3-char alphanumeric body of a deltoid (`∆xxx`), per the BACKLOG.md header. */
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
  /** 1-based line number of the `- ∆xxx …` line. */
  lineStart: number
  /** Source lines the item spans, counting wrapped continuation lines. */
  lineCount: number
  /** The `##` initiative the item lives under — always set in a well-formed file. */
  initiativeHeading: HeadingRef | null
  /** The `###` epic, or null when the item sits directly under the initiative. */
  epicHeading: HeadingRef | null
}

/**
 * The directory holding the nearest `BACKLOG.md`, found by walking up from `cwd`.
 *
 * Nearest wins, which is the safe resolution in a monorepo: run from within a package
 * and you get that package's backlog, never a sibling's. Returns undefined when no
 * `BACKLOG.md` exists in `cwd` or any ancestor — callers error rather than guess.
 */
export function findRepoRoot(cwd: string = process.cwd()): string | undefined {
  const backlog = findUpSync('BACKLOG.md', { cwd })
  return backlog ? dirname(backlog) : undefined
}

/** Extract the `∆xxx` ids from a `; <label>: ∆a, ∆b` dependency suffix. */
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
    // A wrapped item continues on every non-blank line until the next item, heading, or
    // blank line. Continuation is detected by those boundaries, not by indentation: an
    // auto-formatter may de-indent a wrapped line to column 0, and keying off leading
    // whitespace would then silently drop the rest of the item — including any trailing
    // `needs:`/`touches:` suffix.
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
