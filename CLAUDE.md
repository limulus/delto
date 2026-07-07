# @limulus/delto Helper Guide

This project is for a distributable agent skill called delto. It helps you work with
BACKLOG.md files.

## Dogfooding

You are in the unique position to use the delto skill (@skills/delto/SKILL.md) to build
delto. Note that the skill will say to run `npx @limulus/delto <subcommand>`, but in order
to dogfood properly you must run: `node ./src/bin/cli.ts <subcommand>`.

- `.claude/skills/delto` is a symlink to `../../skills/delto` — always Read/Edit the
  canonical `skills/delto/` path.
- `skills/delto/SKILL.md` describes the current contract only, readable by a fresh agent —
  never reference prior behavior ("no longer…", "instead of the old…").
- Skill changes are validated by multi-agent evals written up in `docs/experiments/`.
  Follow their methodology: run each agent in an isolated copy of a consumer repo (rsync
  sans `.git`, own `git init`); grade against sandbox git ground truth
  (`git diff`/`status`/`log`), never the run agent's self-report; and check that `add`
  prompts are genuinely novel against the target backlog, or dedup will eat the scenario.

## Commands

- Build: `npm run build`
- Clean: `npm run clean`
- Lint: `npm run lint`
- Fix linting: `npm run lint:fix`
- Type check: `npm run tscc`
- Test (all): `npm run test`
- Test (single file): `npm test -- src/path/to/file.spec.ts`
- Test packaging: `npm run test:pack` (real `npm pack` against the manifest — run when
  touching `package.json` `files`/`bin`/deps; see CI and Publishing below)
- Verify (lint+test+typecheck): `npm run verify`

## Architecture Decisions

Significant architectural decisions are captured in `docs/decisions/` as numbered ADRs.
Reference them as `ADR-NNN` (e.g. `ADR-001`) in prose, commits, and journal entries.
Read the relevant ADR before working on an area it covers.

- [ADR-001 — `delto` CLI and skill shape](./docs/decisions/001-delto-cli-and-skill-shape.md):
  single `delto` binary, consolidated `/delto` skill, prose-only `SKILL.md`, `--help` as
  the contract, `npx skills add` reads from Git.

## Code Style Guidelines

- **ESM**: Use ES Modules (`import/export` not `require()`)
  - Use `node:` prefix for Node.js built-ins
- **File Extensions**: Always include `.ts` in imports (e.g., `import x from './x.ts'`).
  Node runs `.ts` files directly via its built-in type-stripping — no build step needed
  for scripts. The build emits `.js` via `rewriteRelativeImportExtensions`.
- **Typing**: Use strict TypeScript typing, prefer interfaces for object types
  - `erasableSyntaxOnly` and `verbatimModuleSyntax` are on — no enums, namespaces, or
    parameter properties; prefer inline `type` specifiers
    (e.g., `import { foo, type Bar } from './baz.ts'`)
- **Semicolons**: Do not use semicolons to end statements (rely on ASI)
- **Naming**:
  - Classes: PascalCase
  - Methods/variables: camelCase
  - Files: kebab-case for modules
- **Testing**: 100% coverage required for all production code
  - Vitest enforces the gate via `100/100/100/100` (functions/branches/lines/statements)
  - Write tests first — red/green/refactor: a failing test, the code that makes it pass,
    then cleanup
  - Never use a coverage-ignore comment for code only reachable as a process entry point —
    isolate it in `src/bin/cli.ts` (excluded from coverage in `vitest.config.ts`) and
    prove it with a spawn-based smoke test
- **Error Handling**: Use typed errors and proper propagation
- **Comments**:
  - Only add comments to explain _why_ code is doing something unusual or non-obvious
  - Avoid comments that merely describe _what_ the code is doing (the code already shows that)
  - Use JSDoc for public API documentation where appropriate
- **Project Structure**:
  - `src/lib/` - Core functionality (pure logic; must never import from `src/bin/`)
  - `src/bin/` - CLI entry points (thin arg-parsing + I/O wrappers over `src/lib/`)
  - `src/mocks/` - Test mocks
  - Gotcha: `findRepoRoot()` in `src/lib/backlog.ts` walks up to the nearest `BACKLOG.md`
    (not the git root) and returns `undefined` rather than exiting — the bin layer owns
    the stderr message and exit code

## Software Development Methodology

- Use red/green/refactor test driven development
- 100% test coverage is required
- Avoid `vi.mock()` — inject seams instead: subcommands take `RunOptions`
  (`stdout`/`stderr`/`cwd`), defaulted via the `out`/`err`/`cwd` helpers in
  `src/lib/io.ts`, so tests drive real temp repos through the real `run()` (no
  `process.chdir`)
- Use MSW for HTTP/GraphQL API mocks
- Prefer assertions over defensive type checks to avoid test bloat
- Mutation-check regression guards: a test written for already-correct state must be seen
  red once — temporarily perturb the guarded thing, confirm exactly the intended test
  fails, revert

## CI and Publishing

- Keep `.github/workflows/cd.yaml`'s trigger as unrestricted `on: push`. Restricting it to
  `[main]` silently stops `semantic-release` from publishing off maintenance/prerelease
  branches (`1.x`, `next`) — release-branch gating belongs in semantic-release's
  `branches` config, which no-ops on other branches.
- `npm run test:pack` is deliberately outside `verify`: its `prepack` → `prebuild` →
  `clean` lifecycle deletes `coverage/` (and its own config runs coverage off). It runs
  after `verify` in the pre-push hook, and in CI only after the coverage artifact upload —
  keep that ordering.
- Publishing uses npm OIDC trusted publishing: the publish job grants `id-token: write`
  and passes no `NPM_TOKEN`. The trusted publisher is registered on npmjs.com *without* a
  GitHub Actions environment, so never add an `environment:` key to the publish job — the
  token exchange would be rejected.
- Tests and mocks are excluded from the build (`tsconfig.build.json`) and the tarball
  (`files` negations) but never from type-checking — `tscc` deliberately runs the root
  `tsconfig.json`.
- Right after a publish, a stale npx cache can report `delto: command not found` — clear
  the npx cache before suspecting the tarball.

## Commit Message Guidelines

Versions of this software are automatically determined by `semantic-release`. Follow
`conventionalcommits.org` standard, specifically the `@commitlint/config-conventional`
format.

- `feat: msg`: features
- `fix: msg`: bug fixes
- `refactor: msg`: code improvements that do not affect functionality
- `test: msg`: changes in tests only, does not affect functionality
- `docs: msg`: changes to documentation
- `ci: msg`: build pipeline
- `chore: msg`: updating dependencies, miscellany
- Breaking changes to exposed APIs surfaces must be documented with a footer/trailer. For
  example:

  ```
  feat: remove the `POST /api/spline/reticulate` endpoint

  BREAKING CHANGE: Support for previously deprecated spline reticulation
    has been removed. Use `POST /api/spline/frobnicate` instead.
  ```

- Scopes may also be used:
  - `feat(ui): increase button roundness`
  - `docs(readme): add frobnication section`
  - `chore(dev-deps): update dev dependencies`
  - `chore(deps): update dependencies`

Only certain commit messages will trigger changes to the semantic version of the software:

- A breaking change will trigger a major version bump, regardless of the prefix
- The `feat` prefix bumps the minor version
- The `fix` prefix bumps the patch version
- All other commit messages have no effect on the version
- Skill prose under `skills/` ships to consumers via Git (`npx skills add`), not the npm
  tarball, so skill-only changes are `docs(skill):`, never `feat`/`fix` — a
  version-bumping type would publish a release whose tarball is unchanged
