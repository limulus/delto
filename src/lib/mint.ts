import { randomInt } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ID } from './backlog.ts'

/** The 62-char alphabet of a deltoid's 3-char body. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/**
 * Every deltoid body that already appears in `backlogPath` or any file in `journalDir`. A
 * long-lived repo's journal can hold hundreds to thousands of entries, so the files are
 * read concurrently rather than one at a time.
 */
export async function takenIds(
  backlogPath: string,
  journalDir: string
): Promise<Set<string>> {
  const files = [backlogPath]
  if (existsSync(journalDir)) {
    for (const ent of await readdir(journalDir, { withFileTypes: true })) {
      if (ent.isFile()) files.push(join(journalDir, ent.name))
    }
  }
  const taken = new Set<string>()
  for (const text of await Promise.all(files.map((f) => readFile(f, 'utf8')))) {
    for (const m of text.matchAll(new RegExp(`∆(${ID})`, 'g'))) taken.add(m[1])
  }
  return taken
}

/** A random 3-char deltoid body drawn from the alphabet. */
export function randomId(): string {
  let body = ''
  for (let i = 0; i < 3; i++) body += ALPHABET[randomInt(ALPHABET.length)]
  return body
}

/** Mint `count` ids distinct from each other and from every already-taken id. */
export function mint(
  count: number,
  taken: Set<string>,
  next: () => string = randomId
): string[] {
  const used = new Set(taken)
  const capacity = ALPHABET.length ** 3 - used.size
  if (count > capacity) {
    throw new RangeError(
      `cannot mint ${count} unique deltoids — only ${Math.max(0, capacity)} of the ${ALPHABET.length ** 3} id space remain`
    )
  }
  const out: string[] = []
  while (out.length < count) {
    const id = next()
    if (used.has(id)) continue
    used.add(id)
    out.push(id)
  }
  return out
}
