/** A stream a subcommand writes to — a process stream, or a test double that records writes. */
export interface OutputStream {
  write(chunk: string): unknown
}

/** The ambient I/O and working directory a subcommand resolves from. Injectable so tests can
 *  capture output and pin the cwd. */
export interface RunOptions {
  stdout?: OutputStream
  stderr?: OutputStream
  /** Directory to resolve the nearest BACKLOG.md from. Defaults to `process.cwd()`. */
  cwd?: string
}

/** The stdout stream a subcommand should write to — the caller's, or the process default. */
export const out = (opts: RunOptions): OutputStream => opts.stdout ?? process.stdout

/** The stderr stream a subcommand should write to — the caller's, or the process default. */
export const err = (opts: RunOptions): OutputStream => opts.stderr ?? process.stderr

/** The directory a subcommand resolves paths from — the caller's, or `process.cwd()`. */
export const cwd = (opts: RunOptions): string => opts.cwd ?? process.cwd()
