/**
 * main.ts
 *
 * Shared shape and defaults for every CLI's `main(argv, opts)` entry point. Keeps the
 * scripts testable: tests pass in their own `log`/`err`/`cwd`; the dispatcher and
 * production runs let the defaults fall through to `console` and `process.cwd()`.
 */

export interface MainOpts {
  cwd?: string
  log?: (line: string) => void
  err?: (line: string) => void
}

export interface ResolvedMainOpts {
  cwd: string
  log: (line: string) => void
  err: (line: string) => void
}

function defaultLog(line: string): void {
  console.log(line)
}

function defaultErr(line: string): void {
  console.error(line)
}

export function defaults(opts: MainOpts): ResolvedMainOpts {
  return {
    cwd: opts.cwd ?? process.cwd(),
    log: opts.log ?? defaultLog,
    err: opts.err ?? defaultErr,
  }
}
