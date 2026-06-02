# @limulus/delto Helper Guide

This project is for a distributable agent skill called delto. It helps you work with
BACKLOG.md files.

## Dogfooding

You are in the unique position to use the delto skill (@skills/delto/SKILL.md) to build
delto. Note that the skill will say to run `npx @limululs/delto <subcommand>`, but in order
to dogfood properly you must run: `node ./src/bin/cli.ts <subcommand>`.

## Commands

- Build: `npm run build`
- Clean: `npm run clean`
- Lint: `npm run lint`
- Fix linting: `npm run lint:fix`
- Type check: `npm run tscc`
- Test (all): `npm run test`
- Test (single file): `npm test -- src/path/to/file.spec.ts`
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
    then cleanup. Existing un-tested code (the skill scripts under `skills/`) is
    grandfathered until it migrates into `src/`, at which point it earns its tests TDD-style
- **Error Handling**: Use typed errors and proper propagation
- **Comments**:
  - Only add comments to explain _why_ code is doing something unusual or non-obvious
  - Avoid comments that merely describe _what_ the code is doing (the code already shows that)
  - Use JSDoc for public API documentation where appropriate
- **Project Structure**:
  - `src/lib/` - Core functionality
  - `src/bin/` - CLI entry points
  - `src/mocks/` - Test mocks

## Software Development Methodology

- Use red/green/refactor test driven development
- 100% test coverage is required
- Avoid `vi.mock()`
- Use MSW for HTTP/GraphQL API mocks
- Prefer assertions over defensive type checks to avoid test bloat

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
