import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFeed, useFeatured } from '../../src/hooks/useFeed'
import api from '../../src/lib/api'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('useFeed and useFeatured', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches the paginated feed and loads the next page when available', async () => {
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/api/feed/home') {
        throw new Error(`Unexpected URL: ${url}`)
      }

      const page = Number(config?.params?.page ?? 1)
      return Promise.resolve({
        data: {
          articles: [
            {
              id: `article-${page}`,
              title: `Page ${page}`,
              slug: `page-${page}`,
              status: 'PUBLISHED',
              author_id: 'author-1',
              read_time_minutes: 5,
              views_count: 10,
              likes_count: 2,
              comments_count: 1,
              is_featured: 0,
              created_at: '2026-03-20T00:00:00Z',
              tags: [],
            },
          ],
          feed: 'latest',
          page,
          has_more: page === 1,
        },
      })
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useFeed('home'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.pages).toHaveLength(1)
    expect(api.get).toHaveBeenCalledWith('/api/feed/home', { params: { page: 1 } })

    await act(async () => {
      await result.current.fetchNextPage()
    })

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2)
    })

    expect(api.get).toHaveBeenLastCalledWith('/api/feed/home', { params: { page: 2 } })
  })

  it('returns an empty featured list when the API payload is missing articles', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: {} })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useFeatured(), { wrapper: Wrapper })

    expect(result.current.data).toEqual([])

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/feed/featured')
    })

    expect(result.current.data).toEqual([])
  })
})
