import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useAddToReadingList,
  useCreateReadingList,
  useReadingList,
  useReadingLists,
} from '../../src/hooks/useReadingLists'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useReadingLists hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches reading lists and reading list detail', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          reading_lists: [{ id: 'rl-1', user_id: 'u1', name: 'Weekend', is_public: false, is_default: false, article_count: 2, created_at: '2026-01-01', updated_at: '2026-01-02' }],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          id: 'rl-1',
          user_id: 'u1',
          name: 'Weekend',
          is_public: false,
          is_default: false,
          article_count: 2,
          created_at: '2026-01-01',
          updated_at: '2026-01-02',
          items: [{ id: 'item-1', list_id: 'rl-1', article_id: 'a1', sort_order: 1, added_at: '2026-01-02' }],
        },
      } as never)

    const list = createQueryClientWrapper()
    const detail = createQueryClientWrapper()

    const listResult = renderHook(() => useReadingLists(true), { wrapper: list.Wrapper })
    const detailResult = renderHook(() => useReadingList('rl-1', true), { wrapper: detail.Wrapper })

    await waitFor(() => {
      expect(listResult.result.current.isSuccess).toBe(true)
      expect(detailResult.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/reading-lists', { params: { page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/reading-lists/rl-1')
  })

  it('creates a list and adds an article to it', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'rl-2' } } as never)
      .mockResolvedValueOnce({ data: { id: 'item-2' } } as never)

    const create = createQueryClientWrapper()
    const add = createQueryClientWrapper()

    const createHook = renderHook(() => useCreateReadingList(), { wrapper: create.Wrapper })
    const addHook = renderHook(() => useAddToReadingList(), { wrapper: add.Wrapper })

    await act(async () => {
      await createHook.result.current.mutateAsync({ name: 'Research' })
      await addHook.result.current.mutateAsync({ listId: 'rl-2', articleId: 'article-1' })
    })

    expect(api.post).toHaveBeenCalledWith('/api/reading-lists', { name: 'Research' })
    expect(api.post).toHaveBeenCalledWith('/api/reading-lists/rl-2/articles/article-1', { note: undefined })
  })
})
