import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useAdminStats,
  useAdminUsers,
  useApprovalQueue,
  useBanUser,
  useNotifications,
  useUnbanUser,
} from '../../src/hooks/useAdmin'
import { createQueryClientWrapper } from '../utils/queryClient'
import { makeArticleDetail, makeUser } from '../utils/fixtures'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('useAdmin hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches admin stats when enabled', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        total_users: 10,
        total_comments: 20,
        articles_by_status: [],
        top_articles: [],
      },
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useAdminStats(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/admin/stats')
    expect(result.current.data?.total_users).toBe(10)
  })

  it('does not fetch admin stats or admin users when disabled', () => {
    const stats = createQueryClientWrapper()
    const users = createQueryClientWrapper()

    const statsResult = renderHook(() => useAdminStats(false), { wrapper: stats.Wrapper })
    const usersResult = renderHook(() => useAdminUsers(1, false), { wrapper: users.Wrapper })

    expect(statsResult.result.current.fetchStatus).toBe('idle')
    expect(usersResult.result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('fetches approval queue, users, and notifications', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          queue: [makeArticleDetail({ id: 'article-1', slug: 'approval-1' })],
          pagination: { page: 2, limit: 20, total: 21, pages: 2, has_more: false },
        },
      })
      .mockResolvedValueOnce({
        data: {
          users: [makeUser({ id: 'user-9', name: 'Admin User' })],
          pagination: { page: 3, limit: 20, total: 41, pages: 3, has_more: false },
        },
      })
      .mockResolvedValueOnce({
        data: {
          notifications: [{ id: 'n1', type: 'INFO', message: 'Hello', is_read: 0, created_at: '2026-03-20T00:00:00Z' }],
          pagination: { page: 1, limit: 20, total: 1, pages: 1, has_more: false },
        },
      })

    const queue = createQueryClientWrapper()
    const users = createQueryClientWrapper()
    const notifications = createQueryClientWrapper()

    const queueResult = renderHook(() => useApprovalQueue(2), { wrapper: queue.Wrapper })
    const usersResult = renderHook(() => useAdminUsers(3), { wrapper: users.Wrapper })
    const notificationResult = renderHook(() => useNotifications(), { wrapper: notifications.Wrapper })

    await waitFor(() => {
      expect(queueResult.result.current.isSuccess).toBe(true)
      expect(usersResult.result.current.isSuccess).toBe(true)
      expect(notificationResult.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/admin/queue', { params: { page: 2 } })
    expect(api.get).toHaveBeenCalledWith('/api/admin/users', { params: { page: 3 } })
    expect(api.get).toHaveBeenCalledWith('/api/admin/notifications')
  })

  it('invalidates admin users after ban and unban', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} })

    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const banHook = renderHook(() => useBanUser(), { wrapper: Wrapper })
    const unbanHook = renderHook(() => useUnbanUser(), { wrapper: Wrapper })

    await act(async () => {
      await banHook.result.current.mutateAsync('user-1')
      await unbanHook.result.current.mutateAsync('user-1')
    })

    expect(api.put).toHaveBeenCalledWith('/api/admin/users/user-1/ban')
    expect(api.put).toHaveBeenCalledWith('/api/admin/users/user-1/unban')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'users'] })
  })
})
