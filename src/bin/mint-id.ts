/**
 * mint-id.ts
 *
 * Mints fresh `∆xxx` backlog IDs for the add-backlog-item skill. An ID is a 3-char
 * `[A-Za-z0-9]` body (see the BACKLOG.md header). The minted IDs avoid every `∆xxx`
 * token that textually appears in BACKLOG.md or any file under docs/journal/ — the
 * same conservative scope as the BACKLOG.md generator one-liner (which `grep -r`s both),
 * so a new ID never collides with a live item, a completed journal entry, or a `needs:`/
 * `touches:` reference.
 *
 * Print-only — it never edits BACKLOG.md; the add-backlog-item skill drives the edit.
 *
 * Library entry point — exposes `main(argv, opts)` for the `delto` CLI dispatcher.
 * End users invoke it as `delto mint [--count N]` (or `delto add`). Output is one
 * `∆xxx` per line and nothing else, so it can be consumed directly.
 */

import { randomInt } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { type MainOpts, defaults } from './main.ts'
import { ID, findRepoRoot } from '../lib/backlog-parser.ts'

/** The 62-char alphabet of the 3-char ID body, per the BACKLOG.md header. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** Every `∆xxx` ID body that already appears anywhere in BACKLOG.md or docs/journal/. */
export function takenIds(repoRoot: string): Set<string> {
  const taken = new Set<string>()
  const scan = (text: string): void => {
    for (const m of text.matchAll(new RegExp(`∆(${ID})`, 'g'))) taken.add(m[1])
  }
  scan(readFileSync(join(repoRoot, 'BACKLOG.md'), 'utf8'))
  const journalDir = join(repoRoot, 'docs', 'journal')
  if (existsSync(journalDir)) {
    for (const ent of readdirSync(journalDir, { withFileTypes: true })) {
      if (ent.isFile()) scan(readFileSync(join(journalDir, ent.name), 'utf8'))
    }
  }
  return taken
}

export function randomId(): string {
  let s = ''
  for (let i = 0; i < 3; i++) s += ALPHABET[randomInt(ALPHABET.length)]
  return s
}

/** Mint `count` IDs distinct from each other and from every already-taken ID. */
export function mint(
  count: number,
  taken: Set<string>,
  next: () => string = randomId
): string[] {
  const used = new Set(taken)
  const out: string[] = []
  while (out.length < count) {
    const id = next()
    if (used.has(id)) continue
    used.add(id)
    out.push(id)
  }
  return out
}

export function main(argv: string[], opts: MainOpts = {}): number {
  const { log, err, cwd } = defaults(opts)
  let count = 1
  const countFlag = argv.indexOf('--count')
  if (countFlag !== -1) {
    const n = Number(argv[countFlag + 1])
    if (!Number.isInteger(n) || n < 1) {
      err(`--count needs a positive integer (got: ${JSON.stringify(argv[countFlag + 1])})`)
      return 1
    }
    count = n
  }
  const repoRoot = findRepoRoot(cwd)
  for (const id of mint(count, takenIds(repoRoot))) log('∆' + id)
  return 0
}
