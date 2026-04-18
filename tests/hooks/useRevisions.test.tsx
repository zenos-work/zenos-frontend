import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import { useArticleRevision, useArticleRevisions } from '../../src/hooks/useRevisions'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('useRevisions hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches revision list and a specific revision snapshot', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          revisions: [{ id: 'rev-1', article_id: 'article-1', version_number: 2, title: 'Updated', editor_id: 'u1', edit_type: 'manual', word_count: 1200, char_diff: 85, created_at: '2026-01-02' }],
          pagination: { page: 1, limit: 20, total: 1, pages: 1, has_more: false },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          id: 'rev-1', article_id: 'article-1', version_number: 2, title: 'Updated', editor_id: 'u1', edit_type: 'manual', word_count: 1200, char_diff: 85, created_at: '2026-01-02', content: 'snapshot',
        },
      } as never)

    const list = createQueryClientWrapper()
    const detail = createQueryClientWrapper()

    const listResult = renderHook(() => useArticleRevisions('article-1', true), { wrapper: list.Wrapper })
    const detailResult = renderHook(() => useArticleRevision('article-1', 2, true), { wrapper: detail.Wrapper })

    await waitFor(() => {
      expect(listResult.result.current.isSuccess).toBe(true)
      expect(detailResult.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/articles/article-1/revisions')
    expect(api.get).toHaveBeenCalledWith('/api/articles/article-1/revisions/2')
  })
})
