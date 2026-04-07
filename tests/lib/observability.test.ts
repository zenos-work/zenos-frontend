import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('observability', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('uses sendBeacon when available and falls back to fetch otherwise', async () => {
    vi.stubEnv('VITE_OBSERVABILITY_ENDPOINT', 'https://obs.zenos.test/ingest')
    const sendBeaconMock = vi.fn(() => true)
    const fetchMock = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/explore', search: '?tag=ai' },
    })
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { sendBeacon: sendBeaconMock },
    })
    vi.stubGlobal('fetch', fetchMock)

    const { trackEvent } = await import('../../src/lib/observability')
    await trackEvent('page_view', { source: 'test' })

    expect(sendBeaconMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to fetch and reports runtime errors with metadata', async () => {
    vi.stubEnv('VITE_OBSERVABILITY_ENDPOINT', 'https://obs.zenos.test/ingest')
    const sendBeaconMock = vi.fn(() => false)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/article/alpha', search: '' },
    })
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { sendBeacon: sendBeaconMock },
    })
    vi.stubGlobal('fetch', fetchMock)

    const { initObservability, reportError } = await import('../../src/lib/observability')
    const listeners = new Map<string, EventListener>()
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      listeners.set(type, listener as EventListener)
    })

    initObservability()
    await reportError(new Error('boom'), { area: 'test' })
    listeners.get('unhandledrejection')?.({ reason: 'async boom' } as unknown as Event)

    expect(fetchMock).toHaveBeenCalled()
    expect(fetchMock.mock.calls[0][0]).toBe('https://obs.zenos.test/ingest')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      keepalive: true,
    })
    expect(fetchMock.mock.calls.some(([, init]) => String(init.body).includes('runtime_error'))).toBe(true)
    expect(fetchMock.mock.calls.some(([, init]) => String(init.body).includes('async boom'))).toBe(true)
  })
})
