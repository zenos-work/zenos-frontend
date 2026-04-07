import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useClearReadingHistory,
  useReadingHistory,
  useRemoveReadingHistoryItem,
  useUpsertReadingHistoryItem,
} from '../../src/hooks/useReadingHistory'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useReadingHistory hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches reading history and respects the enabled flag', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [{ id: 'history-1', slug: 'alpha', title: 'Alpha', progress: 35, read_time_minutes: 6, last_read_at: '2026-04-01T00:00:00Z' }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      },
    })

    const enabledWrapper = createQueryClientWrapper()
    const enabledResult = renderHook(() => useReadingHistory(1, 10, true), {
      wrapper: enabledWrapper.Wrapper,
    })

    await waitFor(() => {
      expect(enabledResult.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/users/me/reading-history', { params: { page: 1, limit: 10 } })

    const disabledWrapper = createQueryClientWrapper()
    renderHook(() => useReadingHistory(2, 20, false), { wrapper: disabledWrapper.Wrapper })
    expect(vi.mocked(api.get)).toHaveBeenCalledTimes(1)
  })

  it('upserts a reading history item and invalidates the history query', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} })
    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useUpsertReadingHistoryItem(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        article_id: 'article-1',
        slug: 'alpha',
        title: 'Alpha',
        read_time_minutes: 7,
        progress: 40,
      })
    })

    expect(api.put).toHaveBeenCalledWith('/api/users/me/reading-history', expect.objectContaining({ article_id: 'article-1' }))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'me', 'reading-history'] })
  })

  it('removes one item or clears all items and invalidates the same query key', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} })
    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const removeHook = renderHook(() => useRemoveReadingHistoryItem(), { wrapper: Wrapper })
    await act(async () => {
      await removeHook.result.current.mutateAsync('article-2')
    })

    const clearHook = renderHook(() => useClearReadingHistory(), { wrapper: Wrapper })
    await act(async () => {
      await clearHook.result.current.mutateAsync()
    })

    expect(api.delete).toHaveBeenNthCalledWith(1, '/api/users/me/reading-history/article-2')
    expect(api.delete).toHaveBeenNthCalledWith(2, '/api/users/me/reading-history')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'me', 'reading-history'] })
  })
})
