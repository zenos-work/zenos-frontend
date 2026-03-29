import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { articleKeys } from './useArticles'
import type { ArticleList } from '../types'

type BookmarkApiResponse = {
  bookmarks?: ArticleList[]
  items?: ArticleList[]
  data?: ArticleList[]
  pagination?: {
    page?: number
    limit?: number
    total?: number
    pages?: number
  }
}

export type BookmarkQueryResult = {
  items: ArticleList[]
  page: number
  limit: number
  total: number
  pages: number
  has_more: boolean
}

export const useLike = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (liked: boolean) =>
      liked
        ? api.post(`/api/social/likes/${articleId}`)
        : api.delete(`/api/social/likes/${articleId}`),
    // Optimistic update — instant feedback, rollback on error
    onMutate: async (liked) => {
      await qc.cancelQueries({ queryKey: articleKeys.detail(articleId) })
      const prev = qc.getQueryData(articleKeys.detail(articleId))
      qc.setQueryData(articleKeys.detail(articleId), (old: ArticleList | undefined) =>
        old
          ? { ...old, likes_count: old.likes_count + (liked ? 1 : -1) }
          : old,
      )
      return { prev }
    },
    onError: (_err, _liked, ctx) => {
      qc.setQueryData(articleKeys.detail(articleId), ctx?.prev)
    },
  })
}

export const useBookmark = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookmarked: boolean) =>
      bookmarked
        ? api.post(`/api/social/bookmarks/${articleId}`)
        : api.delete(`/api/social/bookmarks/${articleId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export const useBookmarks = (page = 1, limit = 20) =>
  useQuery({
    queryKey: ['bookmarks', page, limit],
    queryFn:  () =>
      api.get<BookmarkApiResponse>('/api/social/bookmarks', {
        params: { page, limit },
      }).then(r => {
        const data = r.data
        const items = data.bookmarks ?? data.items ?? data.data ?? []
        const total = data.pagination?.total ?? items.length
        const pages = data.pagination?.pages ?? Math.max(1, Math.ceil(total / limit))
        const currentPage = data.pagination?.page ?? page
        const currentLimit = data.pagination?.limit ?? limit

        return {
          items,
          page: currentPage,
          limit: currentLimit,
          total,
          pages,
          has_more: currentPage < pages,
        } as BookmarkQueryResult
      }),
  })

export const useFollow = (targetUserId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (following: boolean) =>
      following
        ? api.post(`/api/social/follows/${targetUserId}`)
        : api.delete(`/api/social/follows/${targetUserId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed', 'following'] })
      qc.invalidateQueries({ queryKey: ['user', targetUserId] })
      qc.invalidateQueries({ queryKey: ['follow', 'status', targetUserId] })
    },
  })
}

export const useFollowStatus = (targetUserId: string) =>
  useQuery({
    queryKey: ['follow', 'status', targetUserId],
    queryFn: () =>
      api.get<{ is_following: boolean }>(`/api/social/follows/${targetUserId}/check`)
        .then(r => r.data.is_following),
  })

export const useShare = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (provider: 'linkedin' = 'linkedin') =>
      api.post<{ share: { article_id: string; provider: string; share_count: number } }>(
        `/api/social/shares/${articleId}`,
        { provider },
      ),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: articleKeys.detail(articleId) })
      const prev = qc.getQueryData(articleKeys.detail(articleId))
      qc.setQueryData(articleKeys.detail(articleId), (old: ArticleList | undefined) =>
        old ? { ...old, shares_count: (old.shares_count ?? 0) + 1 } : old,
      )
      return { prev }
    },
    onError: (_err, _provider, ctx) => {
      qc.setQueryData(articleKeys.detail(articleId), ctx?.prev)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.myList() })
      qc.invalidateQueries({ queryKey: articleKeys.lists() })
    },
  })
}
