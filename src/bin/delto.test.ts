import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { run, type Subcommand } from './delto.ts'
import { Capture } from '../mocks/capture.ts'

const cliPath = fileURLToPath(new URL('./cli.ts', import.meta.url))
const spawnDelto = (args: string[]) =>
  spawnSync(process.execPath, [cliPath, ...args], { encoding: 'utf8' })

function fakeSub(overrides: Partial<Subcommand> = {}): Subcommand {
  return {
    name: 'fake',
    summary: 'a fake subcommand',
    run: async () => 0,
    ...overrides,
  }
}

describe('delto router', () => {
  it('prints help and exits 0 with no arguments', async () => {
    const stdout = new Capture()
    const stderr = new Capture()
    const code = await run([], { stdout, stderr })
    expect(code).toBe(0)
    expect(stdout.text).toContain('Usage: delto <subcommand>')
    expect(stderr.text).toBe('')
  })

  it('prints help and exits 0 on --help', async () => {
    const stdout = new Capture()
    const code = await run(['--help'], { stdout })
    expect(code).toBe(0)
    expect(stdout.text).toContain('Usage: delto <subcommand>')
  })

  it('prints help and exits 0 on -h', async () => {
    const stdout = new Capture()
    const code = await run(['-h'], { stdout })
    expect(code).toBe(0)
    expect(stdout.text).toContain('Usage: delto <subcommand>')
  })

  it('help shows "(none wired yet)" when no subcommands are registered', async () => {
    const stdout = new Capture()
    await run([], { stdout, subcommands: [] })
    expect(stdout.text).toContain('(none wired yet)')
  })

  it('help lists registered subcommands with their summaries', async () => {
    const stdout = new Capture()
    await run([], {
      stdout,
      subcommands: [
        fakeSub({ name: 'foo', summary: 'foo does foo' }),
        fakeSub({ name: 'bar', summary: 'bar does bar' }),
      ],
    })
    expect(stdout.text).toContain('foo')
    expect(stdout.text).toContain('foo does foo')
    expect(stdout.text).toContain('bar')
    expect(stdout.text).toContain('bar does bar')
  })

  it('dispatches to a matching subcommand with sliced argv and propagates exit code', async () => {
    let receivedArgv: string[] | null = null
    const code = await run(['foo', 'a', '--flag'], {
      subcommands: [
        fakeSub({
          name: 'foo',
          run: async (argv) => {
            receivedArgv = argv
            return 42
          },
        }),
      ],
    })
    expect(code).toBe(42)
    expect(receivedArgv).toEqual(['a', '--flag'])
  })

  it('errors and exits 1 on an unknown subcommand', async () => {
    const stdout = new Capture()
    const stderr = new Capture()
    const code = await run(['nonexistent'], { stdout, stderr })
    expect(code).toBe(1)
    expect(stderr.text).toContain("unknown subcommand: 'nonexistent'")
    expect(stdout.text).toBe('')
  })

  it('errors on unknown subcommand even when other subcommands are registered', async () => {
    const stderr = new Capture()
    const code = await run(['nope'], {
      stderr,
      subcommands: [fakeSub({ name: 'foo' })],
    })
    expect(code).toBe(1)
    expect(stderr.text).toContain("unknown subcommand: 'nope'")
  })

  it('errors and exits 1 on an unknown router flag', async () => {
    const stderr = new Capture()
    const code = await run(['--bogus'], { stderr })
    expect(code).toBe(1)
    expect(stderr.text.toLowerCase()).toContain('--bogus')
  })
})

describe('delto bootstrap (smoke)', () => {
  it('runs as a script: --help exits 0 with help on stdout', () => {
    const result = spawnDelto(['--help'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Usage: delto <subcommand>')
    expect(result.stderr).toBe('')
  })

  it('runs as a script: unknown subcommand exits 1 with error on stderr', () => {
    const result = spawnDelto(['nope'])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("unknown subcommand: 'nope'")
  })
})
