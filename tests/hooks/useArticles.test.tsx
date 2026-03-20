import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  articleKeys,
  useApproveArticle,
  useArticle,
  useArticles,
  useCreateArticle,
  useDeleteArticle,
  useMyArticles,
  usePublishArticle,
  useRejectArticle,
  useSubmitArticle,
  useUpdateArticle,
} from '../../src/hooks/useArticles'
import { createQueryClientWrapper } from '../utils/queryClient'
import { makeArticle, makeArticleDetail, makePaginatedResponse } from '../utils/fixtures'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useArticles hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches articles with params', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: makePaginatedResponse([makeArticle()], { page: 3, has_more: true }),
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useArticles({ page: 3, search: 'alpha' }), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/articles', { params: { page: 3, search: 'alpha' } })
    expect(result.current.data?.page).toBe(3)
  })

  it('fetches article detail when an id or slug is provided', async () => {
    const article = makeArticleDetail({ id: 'article-77', slug: 'alpha-77' })
    vi.mocked(api.get).mockResolvedValue({ data: { article } })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useArticle('article-77'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/articles/article-77')
    expect(result.current.data?.slug).toBe('alpha-77')
  })

  it('does not fetch article detail when the id is empty', () => {
    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useArticle(''), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('fetches the current user library', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: makePaginatedResponse([makeArticle()]) })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useMyArticles(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/articles/mine')
  })

  it('invalidates article lists after creating an article', async () => {
    const article = makeArticleDetail({ id: 'article-new', slug: 'new-article' })
    vi.mocked(api.post).mockResolvedValue({ data: { article } })

    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useCreateArticle(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({ title: 'New', content: 'Body' })
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: articleKeys.lists() })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: articleKeys.myList() })
  })

  it('updates article detail caches after editing an article', async () => {
    const articleId = 'article-1'
    const updatedArticle = makeArticleDetail({ id: articleId, slug: 'updated-slug', title: 'Updated Title' })
    vi.mocked(api.put).mockResolvedValue({ data: { article: updatedArticle } })

    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateArticle(articleId), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({ title: 'Updated Title' })
    })

    expect(client.getQueryData(articleKeys.detail(articleId))).toEqual(updatedArticle)
    expect(client.getQueryData(articleKeys.detail(updatedArticle.slug))).toEqual(updatedArticle)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: articleKeys.myList() })
  })

  it('invalidates the right caches for submit, approve, reject, publish, and delete', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { status: 'ok' } })
    vi.mocked(api.delete).mockResolvedValue({ data: {} })

    const { Wrapper, client } = createQueryClientWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const submitHook = renderHook(() => useSubmitArticle('article-1'), { wrapper: Wrapper })
    const approveHook = renderHook(() => useApproveArticle('article-1'), { wrapper: Wrapper })
    const rejectHook = renderHook(() => useRejectArticle('article-1'), { wrapper: Wrapper })
    const publishHook = renderHook(() => usePublishArticle('article-1'), { wrapper: Wrapper })
    const deleteHook = renderHook(() => useDeleteArticle(), { wrapper: Wrapper })

    await act(async () => {
      await submitHook.result.current.mutateAsync()
      await approveHook.result.current.mutateAsync()
      await rejectHook.result.current.mutateAsync('Needs work')
      await publishHook.result.current.mutateAsync()
      await deleteHook.result.current.mutateAsync('article-1')
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: articleKeys.detail('article-1') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: articleKeys.myList() })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin', 'queue'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: articleKeys.lists() })
  })
})
