import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useSearchAll,
  useSearchArticles,
  useSearchAuthors,
  useSearchTags,
} from '../../src/hooks/useSearch'
import { createQueryClientWrapper } from '../utils/queryClient'
import { makeArticle, makePaginatedResponse, makeTag, makeUser } from '../utils/fixtures'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('useSearch hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not run search-all for queries shorter than 2 characters', () => {
    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useSearchAll('a'), { wrapper: Wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })

  it('fetches combined search results', async () => {
    const article = makeArticle()
    const tag = makeTag()
    const user = makeUser()
    vi.mocked(api.get).mockResolvedValue({
      data: {
        query: 'ai',
        articles: { items: [article], total: 1 },
        tags: { items: [tag], total: 1 },
        authors: { items: [user], total: 1 },
      },
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useSearchAll('ai'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/search', { params: { q: 'ai', type: 'all' } })
    expect(result.current.data?.articles.total).toBe(1)
  })

  it('fetches article-only results', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: makePaginatedResponse([makeArticle()], { page: 2, has_more: true }),
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useSearchArticles('ai', 2), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/search', { params: { q: 'ai', type: 'articles', page: 2 } })
    expect(result.current.data?.page).toBe(2)
  })

  it('fetches tag-only results', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: makePaginatedResponse([makeTag()], { has_more: false }),
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useSearchTags('fin'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/search', { params: { q: 'fin', type: 'tags', page: 1 } })
    expect(result.current.data?.items[0].slug).toBe('fintech')
  })

  it('fetches author-only results', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: makePaginatedResponse([makeUser()], { has_more: false }),
    })

    const { Wrapper } = createQueryClientWrapper()
    const { result } = renderHook(() => useSearchAuthors('alex'), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/search', { params: { q: 'alex', type: 'authors', page: 1 } })
    expect(result.current.data?.items[0].name).toBe('Alex Writer')
  })
})
