import { describe, expect, it, vi } from 'vitest'
import { queryClient } from './queryClient'

describe('queryClient defaults', () => {
  it('has expected query defaults for Phase 7 tuning', () => {
    const defaults = queryClient.getDefaultOptions().queries
    expect(defaults?.staleTime).toBe(1000 * 60 * 5)
    expect(defaults?.gcTime).toBe(1000 * 60 * 15)
    expect(defaults?.refetchOnWindowFocus).toBe(false)
    expect(defaults?.refetchOnReconnect).toBe(true)
    expect(defaults?.refetchOnMount).toBe(false)
    expect(typeof defaults?.retry).toBe('function')
  })

  it('does not retry client (4xx) errors', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry
    expect(typeof retry).toBe('function')

    if (typeof retry === 'function') {
      const shouldRetry = retry(0, { response: { status: 404 } })
      expect(shouldRetry).toBe(false)
    }
  })

  it('retries server (5xx) errors up to threshold', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry
    expect(typeof retry).toBe('function')

    if (typeof retry === 'function') {
      expect(retry(0, { response: { status: 500 } })).toBe(true)
      expect(retry(1, { response: { status: 503 } })).toBe(true)
      expect(retry(2, { response: { status: 503 } })).toBe(false)
    }
  })

  it('logs mutation errors through onError handler', () => {
    const onError = queryClient.getDefaultOptions().mutations?.onError
    expect(typeof onError).toBe('function')

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    if (typeof onError === 'function') {
      onError({ response: { data: { message: 'boom' } } } as unknown, undefined, undefined, undefined)
    }

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
