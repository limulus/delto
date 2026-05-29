import type { OutputStream, RunOptions } from './delto.ts'

/** The stdout stream a subcommand should write to — the caller's, or the process default. */
export const out = (opts: RunOptions): OutputStream => opts.stdout ?? process.stdout

/** The stderr stream a subcommand should write to — the caller's, or the process default. */
export const err = (opts: RunOptions): OutputStream => opts.stderr ?? process.stderr

/** The directory a subcommand resolves paths from — the caller's, or `process.cwd()`. */
export const cwd = (opts: RunOptions): string => opts.cwd ?? process.cwd()
