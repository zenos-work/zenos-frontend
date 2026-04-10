import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import { createQueryClientWrapper } from '../utils/queryClient'
import { useMyEarnings, useRequestPayout } from '../../src/hooks/useEarnings'
import { useSubmitReport } from '../../src/hooks/useReports'
import { useNotificationPrefs, useBulkUpsertNotificationPrefs } from '../../src/hooks/useNotificationPrefs'
import { useRequestDataExport } from '../../src/hooks/useCompliance'
import { useMyActiveSessions, useRevokeSession } from '../../src/hooks/useSessions'
import { useBlockedUsers, useBlockUser } from '../../src/hooks/useBlockMute'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('account infra hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls earnings/report/compliance/session/block endpoints', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { items: [] } } as never)
      .mockResolvedValueOnce({ data: { preferences: [] } } as never)
      .mockResolvedValueOnce({ data: { items: [] } } as never)
      .mockResolvedValueOnce({ data: { items: [] } } as never)

    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'payout-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'report-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'export-1' } } as never)
      .mockResolvedValueOnce({ data: { status: 'blocked' } } as never)

    vi.mocked(api.put).mockResolvedValue({ data: { updated: 1 } } as never)
    vi.mocked(api.delete).mockResolvedValue({ data: { status: 'ok' } } as never)

    const earnings = createQueryClientWrapper()
    const notif = createQueryClientWrapper()
    const sessions = createQueryClientWrapper()
    const blocks = createQueryClientWrapper()

    const earningsQuery = renderHook(() => useMyEarnings(true), { wrapper: earnings.Wrapper })
    const requestPayout = renderHook(() => useRequestPayout(), { wrapper: earnings.Wrapper })
    const submitReport = renderHook(() => useSubmitReport(), { wrapper: earnings.Wrapper })
    const notifQuery = renderHook(() => useNotificationPrefs(true), { wrapper: notif.Wrapper })
    const bulkNotif = renderHook(() => useBulkUpsertNotificationPrefs(), { wrapper: notif.Wrapper })
    const requestExport = renderHook(() => useRequestDataExport(), { wrapper: notif.Wrapper })
    const sessionsQuery = renderHook(() => useMyActiveSessions(true), { wrapper: sessions.Wrapper })
    const revokeSession = renderHook(() => useRevokeSession(), { wrapper: sessions.Wrapper })
    const blockedQuery = renderHook(() => useBlockedUsers(true), { wrapper: blocks.Wrapper })
    const blockUser = renderHook(() => useBlockUser(), { wrapper: blocks.Wrapper })

    await waitFor(() => {
      expect(earningsQuery.result.current.isSuccess).toBe(true)
      expect(notifQuery.result.current.isSuccess).toBe(true)
      expect(sessionsQuery.result.current.isSuccess).toBe(true)
      expect(blockedQuery.result.current.isSuccess).toBe(true)
    })

    await act(async () => {
      await requestPayout.result.current.mutateAsync({ amount_cents: 5000 })
      await submitReport.result.current.mutateAsync({ resource_type: 'article', resource_id: 'a1', reason: 'spam' })
      await bulkNotif.result.current.mutateAsync([{ notification_type: 'comment_reply', channel: 'email', is_enabled: true }])
      await requestExport.result.current.mutateAsync()
      await revokeSession.result.current.mutateAsync('session-1')
      await blockUser.result.current.mutateAsync({ userId: 'user-2' })
    })

    expect(api.get).toHaveBeenCalledWith('/api/earnings/me', { params: { page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/notification-prefs')
    expect(api.get).toHaveBeenCalledWith('/api/users/me/sessions', { params: { page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/users/me/blocks', { params: { page: 1, limit: 20 } })

    expect(api.post).toHaveBeenCalledWith('/api/earnings/me/payouts/request', { amount_cents: 5000 })
    expect(api.post).toHaveBeenCalledWith('/api/reports', { resource_type: 'article', resource_id: 'a1', reason: 'spam' })
    expect(api.put).toHaveBeenCalledWith('/api/notification-prefs', {
      preferences: [{ notification_type: 'comment_reply', channel: 'email', is_enabled: true }],
    })
    expect(api.post).toHaveBeenCalledWith('/api/users/me/data-export')
    expect(api.delete).toHaveBeenCalledWith('/api/users/me/sessions/session-1')
    expect(api.post).toHaveBeenCalledWith('/api/users/me/blocks/user-2', { reason: undefined })
  })
})
