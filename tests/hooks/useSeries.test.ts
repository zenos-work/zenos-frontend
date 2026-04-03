import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useSeries,
  useCreateSeries,
  useAssignArticleToSeries,
  useRemoveArticleFromSeries,
  useArticleSeries,
} from '../../src/hooks/useSeries'
import { createQueryClientWrapper } from '../utils/queryClient'
import type { Series, ArticleSeriesInfo } from '../../src/hooks/useSeries'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const makeSeries = (overrides: Partial<Series> = {}): Series => ({
  id: 'series-1',
  author_id: 'user-1',
  name: 'Test Series',
  description: 'A test series',
  created_at: '2026-03-20T00:00:00Z',
  updated_at: '2026-03-20T00:00:00Z',
  ...overrides,
})

describe('useSeries hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useSeries', () => {
    it('returns items from API', async () => {
      const series = [makeSeries({ id: 's1', name: 'Alpha' }), makeSeries({ id: 's2', name: 'Beta' })]
      vi.mocked(api.get).mockResolvedValue({ data: { items: series } })

      const { Wrapper } = createQueryClientWrapper()
      const { result } = renderHook(() => useSeries(), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(api.get).toHaveBeenCalledWith('/api/series?limit=100')
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data![0].name).toBe('Alpha')
    })

    it('returns empty array when items is missing', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: {} })

      const { Wrapper } = createQueryClientWrapper()
      const { result } = renderHook(() => useSeries(), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([])
    })
  })

  describe('useCreateSeries', () => {
    it('posts to /api/series and returns new series', async () => {
      const newSeries = makeSeries({ id: 'series-new', name: 'My Series' })
      vi.mocked(api.post).mockResolvedValue({ data: { series: newSeries } })

      const { Wrapper } = createQueryClientWrapper()
      const { result } = renderHook(() => useCreateSeries(), { wrapper: Wrapper })

      await act(async () => {
        await result.current.mutateAsync({ name: 'My Series', description: 'desc' })
      })

      expect(api.post).toHaveBeenCalledWith('/api/series', { name: 'My Series', description: 'desc' })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 'series-new', name: 'My Series' })
    })
  })

  describe('useAssignArticleToSeries', () => {
    it('posts assign endpoint', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { ok: true } })

      const { Wrapper } = createQueryClientWrapper()
      const { result } = renderHook(() => useAssignArticleToSeries(), { wrapper: Wrapper })

      await act(async () => {
        await result.current.mutateAsync({ articleId: 'art-1', seriesId: 'series-1', partNumber: 2 })
      })

      expect(api.post).toHaveBeenCalledWith(
        '/api/series/series-1/articles/art-1',
        { series_id: 'series-1', part_number: 2 },
      )
    })
  })

  describe('useRemoveArticleFromSeries', () => {
    it('calls delete endpoint', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: { ok: true } })

      const { Wrapper } = createQueryClientWrapper()
      const { result } = renderHook(() => useRemoveArticleFromSeries(), { wrapper: Wrapper })

      await act(async () => {
        await result.current.mutateAsync({ articleId: 'art-1', seriesId: 'series-1' })
      })

      expect(api.delete).toHaveBeenCalledWith('/api/series/series-1/articles/art-1')
    })
  })

  describe('useArticleSeries', () => {
    it('returns series info for known article', async () => {
      const info: ArticleSeriesInfo = {
        id: 'series-1',
        name: 'Finance 101',
        part: 2,
        total: 5,
        description: 'Finance series',
      }
      vi.mocked(api.get).mockResolvedValue({ data: { series: info } })

      const { Wrapper } = createQueryClientWrapper()
      const { result } = renderHook(() => useArticleSeries('article-42'), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(api.get).toHaveBeenCalledWith('/api/articles/article-42/series')
      expect(result.current.data?.name).toBe('Finance 101')
      expect(result.current.data?.part).toBe(2)
    })

    it('returns null when API throws', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('404'))

      const { Wrapper } = createQueryClientWrapper()
      const { result } = renderHook(() => useArticleSeries('unknown'), { wrapper: Wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toBeNull()
    })

    it('is disabled when articleId is empty', () => {
      const { Wrapper } = createQueryClientWrapper()
      const { result } = renderHook(() => useArticleSeries(''), { wrapper: Wrapper })

      expect(result.current.fetchStatus).toBe('idle')
    })
  })
})
