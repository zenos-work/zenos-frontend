import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePremiumFunnel } from '../../src/hooks/usePremiumFunnel'

let authState: { user: { id: string } | null } = { user: null }

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

describe('usePremiumFunnel', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    authState = { user: null }
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://referrer.example/article',
    })
  })

  it('logs paywall_shown automatically for anonymous users', async () => {
    fetchMock.mockResolvedValue({ ok: true })

    renderHook(() => usePremiumFunnel('article-1'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/membership/funnel-event',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body).toMatchObject({
      event_type: 'paywall_shown',
      article_id: 'article-1',
      device_type: 'desktop',
      referrer: 'https://referrer.example/article',
    })
  })

  it('does not auto-log paywall view for authenticated users or missing article id', async () => {
    fetchMock.mockResolvedValue({ ok: true })

    authState = { user: { id: 'user-1' } }
    const first = renderHook(() => usePremiumFunnel('article-2'))
    const second = renderHook(() => usePremiumFunnel())

    await first.unmount()
    await second.unmount()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retries failed events when the browser comes back online', async () => {
    authState = { user: { id: 'user-2' } }
    fetchMock
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true })

    const { result } = renderHook(() => usePremiumFunnel('article-3'))

    await result.current.logEvent('paywall_clicked', { device_type: 'tablet' })
    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    const manualBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    const retriedBody = JSON.parse(fetchMock.mock.calls[1][1].body as string)
    expect(manualBody.event_type).toBe('paywall_clicked')
    expect(retriedBody.event_type).toBe('paywall_clicked')
    expect(retriedBody.device_type).toBe('tablet')
  })

  it('stores minimal fallback payload when logging throws and retries it later', async () => {
    authState = { user: { id: 'user-3' } }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ ok: true })

    const { result } = renderHook(() => usePremiumFunnel('article-4'))

    await result.current.logEvent('signup_started')
    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    const retriedBody = JSON.parse(fetchMock.mock.calls[1][1].body as string)
    expect(retriedBody).toMatchObject({
      event_type: 'signup_started',
      article_id: 'article-4',
    })

    errorSpy.mockRestore()
  })
})
