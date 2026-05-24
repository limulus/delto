import { describe, expect, it, vi } from 'vitest'

import { defaults } from './main.ts'

describe('defaults', () => {
  it('falls back to process.cwd and console when nothing is passed', () => {
    const r = defaults({})
    expect(r.cwd).toBe(process.cwd())
    expect(typeof r.log).toBe('function')
    expect(typeof r.err).toBe('function')
  })

  it('routes the default log/err through the global console', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const r = defaults({})
      r.log('hello')
      r.err('whoops')
      expect(logSpy).toHaveBeenCalledWith('hello')
      expect(errSpy).toHaveBeenCalledWith('whoops')
    } finally {
      logSpy.mockRestore()
      errSpy.mockRestore()
    }
  })

  it('preserves caller-supplied overrides', () => {
    const log = vi.fn()
    const err = vi.fn()
    const r = defaults({ cwd: '/tmp/x', log, err })
    expect(r.cwd).toBe('/tmp/x')
    r.log('one')
    r.err('two')
    expect(log).toHaveBeenCalledWith('one')
    expect(err).toHaveBeenCalledWith('two')
  })
})
