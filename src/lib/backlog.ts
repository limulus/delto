import { findUpSync } from 'find-up-simple'
import { dirname } from 'node:path'

/** The 3-char alphanumeric body of a deltoid (`∆xxx`), per the BACKLOG.md header. */
export const ID = '[A-Za-z0-9]{3}'

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
