import { findRepoRoot, parseDeltoid } from '../lib/backlog.ts'
import { type OutputStream } from '../lib/io.ts'

/** Resolve the repo root from `dir`, or write the standard "no BACKLOG.md" error to
 *  `stderr` and return null. `name` is the subcommand name for the message prefix. */
export function requireRepoRoot(
  dir: string,
  stderr: OutputStream,
  name: string
): string | null {
  const root = findRepoRoot(dir)
  if (!root) {
    stderr.write(
      `delto ${name}: no BACKLOG.md found in the current directory or any parent.\n`
    )
    return null
  }
  return root
}

/** Parse a deltoid, or write the standard "not a valid deltoid" error to `stderr` and
 *  return null. `raw` is the user's input (with or without the ∆ sigil). */
export function requireDeltoid(
  raw: string,
  stderr: OutputStream,
  name: string
): string | null {
  const id = parseDeltoid(raw)
  if (id === null) {
    stderr.write(
      `delto ${name}: '${raw}' is not a valid deltoid (∆ followed by 3 alphanumerics).\n`
    )
    return null
  }
  return id
}
