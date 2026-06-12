import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

// The prepack build and the consumer install make this well slower than
// vitest's default timeouts.
const PACK_TIMEOUT = 120_000

interface PackEntry {
  path: string
}

interface PackReport {
  name: string
  filename: string
  files: PackEntry[]
}

interface Manifest {
  bin: Record<string, string>
  main?: string
  exports?: unknown
  types?: string
}

// Drop inherited npm_* vars so a parent npm invocation (e.g. --ignore-scripts)
// can't alter the spawned npm's behavior.
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !/^npm_/i.test(key))
)

let workDir: string
let consumerDir: string
let report: PackReport
let paths: string[]
let manifest: Manifest

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), 'delto-pack-'))
  consumerDir = mkdtempSync(join(tmpdir(), 'delto-consumer-'))

  const pack = spawnSync(
    'npm',
    ['pack', '--json', '--foreground-scripts=false', '--pack-destination', workDir],
    { cwd: repoRoot, encoding: 'utf8', env, timeout: PACK_TIMEOUT }
  )
  expect(pack.error).toBeUndefined()
  expect(pack.status).toBe(0)
  // Lifecycle script output can precede the JSON despite --foreground-scripts=false
  const json = pack.stdout.slice(pack.stdout.indexOf('['))
  report = (JSON.parse(json) as PackReport[])[0]
  paths = report.files.map((file) => file.path)
  manifest = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as Manifest

  // Install from the real tarball so the bin smoke runs against exactly what a
  // consumer gets: only the packed files and the declared runtime dependencies.
  const install = spawnSync(
    'npm',
    ['install', join(workDir, report.filename), '--no-audit', '--no-fund'],
    { cwd: consumerDir, encoding: 'utf8', env, timeout: PACK_TIMEOUT }
  )
  expect(install.error).toBeUndefined()
  expect(install.status).toBe(0)
}, PACK_TIMEOUT)

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true })
  rmSync(consumerDir, { recursive: true, force: true })
})

describe('package manifest (bin-only per ADR-001 / ∆iDx)', () => {
  it('exposes exactly the delto bin pointing at the built CLI', () => {
    expect(manifest.bin).toEqual({ delto: './dist/esm/bin/cli.js' })
  })

  it('has no main, exports, or types entry points', () => {
    expect(manifest.main).toBeUndefined()
    expect(manifest.exports).toBeUndefined()
    expect(manifest.types).toBeUndefined()
  })
})

describe('npm pack tarball shape', () => {
  it('reports the expected package name', () => {
    expect(report.name).toBe('@limulus/delto')
  })

  it('includes package.json', () => {
    expect(paths).toContain('package.json')
  })

  it('includes the bin target', () => {
    const binTarget = manifest.bin.delto.replace(/^\.\//, '')
    expect(paths).toContain(binTarget)
  })

  it('ships the dist/esm, dist/types, and src trees', () => {
    expect(paths.some((path) => path.startsWith('dist/esm/'))).toBe(true)
    expect(paths).toContain('dist/types/bin/cli.d.ts')
    expect(paths).toContain('src/bin/cli.ts')
  })

  it('ships no test files', () => {
    expect(paths.filter((path) => path.includes('.test.'))).toEqual([])
  })

  it('ships no mocks', () => {
    expect(paths.filter((path) => path.includes('mocks/'))).toEqual([])
  })

  it('ships no skill files (the skill travels via Git, not the tarball)', () => {
    expect(paths.filter((path) => path.startsWith('skills/'))).toEqual([])
  })
})

describe('bin installed from the tarball', () => {
  it('links delto into the consumer bin dir and --help runs without import errors', () => {
    const result = spawnSync(
      join(consumerDir, 'node_modules', '.bin', 'delto'),
      ['--help'],
      {
        cwd: consumerDir,
        encoding: 'utf8',
        env,
      }
    )
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Usage: delto <subcommand>')
    expect(result.stderr).toBe('')
  })
})
