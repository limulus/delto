import { randomInt } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ID } from './backlog.ts'

/** The 62-char alphabet of a deltoid's 3-char body. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** Every deltoid body that already appears in `backlogPath` or any file in `journalDir`. */
export function takenIds(backlogPath: string, journalDir: string): Set<string> {
  const taken = new Set<string>()
  const scan = (text: string): void => {
    for (const m of text.matchAll(new RegExp(`∆(${ID})`, 'g'))) taken.add(m[1])
  }
  scan(readFileSync(backlogPath, 'utf8'))
  if (existsSync(journalDir)) {
    for (const ent of readdirSync(journalDir, { withFileTypes: true })) {
      if (ent.isFile()) scan(readFileSync(join(journalDir, ent.name), 'utf8'))
    }
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
