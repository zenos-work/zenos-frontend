import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import { articleKeys } from '../../src/hooks/useArticles'
import { useBookmark, useBookmarks, useFollow, useLike } from '../../src/hooks/useSocial'
import { createQueryClientWrapper } from '../utils/queryClient'
import { makeArticle } from '../utils/fixtures'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useSocial hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes bookmark responses into a paginated result', async () => {
    const article = makeArticle()
    vi.mocked(api.get).mockResolvedValue({
      data: {
        bookmarks: [article],
        pagination: {
          page: 2,
          limit: 10,
          total: 11,
          pages: 2,
        },
      },
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useBookmarks(2, 10), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/social/bookmarks', { params: { page: 2, limit: 10 } })
    expect(result.current.data).toEqual({
      items: [article],
      page: 2,
      limit: 10,
      total: 11,
      pages: 2,
      has_more: false,
    })
  })

  it('optimistically updates likes and rolls back on failure', async () => {
    const articleId = 'article-1'
    const original = makeArticle({ id: articleId, likes_count: 4 })
    vi.mocked(api.post).mockRejectedValue(new Error('like failed'))

    const { Wrapper, client } = createQueryClientWrapper()
    client.setQueryData(articleKeys.detail(articleId), original)

    const { result } = renderHook(() => useLike(articleId), { wrapper: Wrapper })

    await expect(result.current.mutateAsync(true)).rejects.toThrow('like failed')

    expect(api.post).toHaveBeenCalledWith(`/api/social/likes/${articleId}`)
    expect(client.getQueryData(articleKeys.detail(articleId))).toEqual(original)
  })

  it('invalidates bookmarks after bookmarking an article', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} })

    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useBookmark('article-1'), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync(true)
    })

    expect(api.post).toHaveBeenCalledWith('/api/social/bookmarks/article-1')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bookmarks'] })
  })

  it('invalidates following feed and user profile after following an author', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} })

    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useFollow('user-22'), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync(true)
    })

    expect(api.post).toHaveBeenCalledWith('/api/social/follows/user-22')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['feed', 'following'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 'user-22'] })
  })

  it('uses delete endpoint when unliking and updates likes optimistically', async () => {
    const articleId = 'article-2'
    const original = makeArticle({ id: articleId, likes_count: 5 })
    vi.mocked(api.delete).mockResolvedValue({ data: {} })

    const { Wrapper, client } = createQueryClientWrapper()
    client.setQueryData(articleKeys.detail(articleId), original)

    const { result } = renderHook(() => useLike(articleId), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync(false)
    })

    expect(api.delete).toHaveBeenCalledWith(`/api/social/likes/${articleId}`)
    expect(client.getQueryData(articleKeys.detail(articleId))).toEqual(
      makeArticle({ id: articleId, likes_count: 4 }),
    )
  })

  it('uses delete endpoint when removing bookmark', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} })

    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useBookmark('article-9'), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync(false)
    })

    expect(api.delete).toHaveBeenCalledWith('/api/social/bookmarks/article-9')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bookmarks'] })
  })

  it('normalizes alternate bookmark payload shape using items without pagination', async () => {
    const article = makeArticle({ id: 'alt-1' })
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [article],
      },
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useBookmarks(1, 20), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      items: [article],
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
      has_more: false,
    })
  })

  it('uses delete endpoint when unfollowing and invalidates feed/user queries', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} })

    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useFollow('user-50'), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync(false)
    })

    expect(api.delete).toHaveBeenCalledWith('/api/social/follows/user-50')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['feed', 'following'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 'user-50'] })
  })
})
