---
id: ∆hoW
completed: 2026-05-31 06:42:30 +00:00
---

## Backlog item

> - ∆hoW DRY the subcommands and clear the remaining feat/cli-primitives review nits: extract
>   `parseDeltoid()` + `resolveRepoRoot()` lib helpers, resolve cwd once in `complete` (and
>   soften "released the claim" → "cleared any claim"), rename the shadowing `catch (err)` in
>   `delto.ts`, and drop the dead `mkdirSync` in `claims-ledger.ts`.

## Planning

The self-review left four small smells in the subcommand layer: two genuine duplications and
two nits. The duplications were the deltoid parse/validate (in `complete` and in the
`claim`/`release` factory) and the repo-root resolution repeated across four commands. The
nits were a `catch (err)` binding in `delto.ts` that shadowed the imported `err` io helper,
and a no-op `mkdirSync` in the claims ledger.

Both new helpers are pure and live in `lib/backlog.ts`: `parseDeltoid(raw)` strips an optional
`∆` and validates against the `ID` regex; `resolveRepoRoot(opts)` wraps
`findRepoRoot(cwd(opts))`. A deliberate call: `resolveRepoRoot` only fits the two sites
(`surface`, `claim`/`release`) that need nothing but the root. `complete` and `mint` resolve
the cwd into a `dir` they reuse for path work (`resolve(dir, journalPath)` /
`resolve(dir, journalDir)`), so they keep `findRepoRoot(dir)` directly — and that reuse is
exactly the "resolve cwd once in `complete`" fix, which had been calling `cwd(opts)` twice.

## Refinement

The per-command error strings stayed at the call sites because they carry the subcommand name
(`delto complete:` vs `delto release:`), so `parseDeltoid` owns only the parse/validate, not
the message. `resolveRepoRoot` is typed `string | null` while `findRepoRoot` returns
`string | undefined`, so it coalesces with `?? null`. The `complete` success line softened
from "released the claim" to "cleared any claim" — `release` is unconditional (a no-op for an
unclaimed id), so the old wording overstated; no test asserted the literal string, so only the
source changed. New unit tests for both helpers hold coverage at 100% (341 stmts / 136
branches / 45 funcs).

## Retrospective

Importing `cwd` into `backlog.ts` reintroduces a benign shadow: `findRepoRoot`'s parameter is
also named `cwd`. Lint doesn't flag it and the scopes don't collide, so I left it — `cwd` is
the right name for that parameter — but it's mildly ironic in a change that renamed a
shadowing `catch` for the same reason. Splitting the four root-resolution sites two-and-two is
less uniform than forcing all four through one helper, but it's the honest shape: two sites
genuinely need the resolved directory and two don't.
