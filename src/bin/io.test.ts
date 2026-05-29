import { describe, expect, it } from 'vitest'

import { cwd, err, out } from './io.ts'

class Sink {
  write(): boolean {
    return true
  }
}

describe('io stream helpers', () => {
  it('out returns the provided stdout, else process.stdout', () => {
    const sink = new Sink()
    expect(out({ stdout: sink })).toBe(sink)
    expect(out({})).toBe(process.stdout)
  })

  it('err returns the provided stderr, else process.stderr', () => {
    const sink = new Sink()
    expect(err({ stderr: sink })).toBe(sink)
    expect(err({})).toBe(process.stderr)
  })

  it('cwd returns the provided cwd, else process.cwd()', () => {
    expect(cwd({ cwd: '/somewhere' })).toBe('/somewhere')
    expect(cwd({})).toBe(process.cwd())
  })
})
