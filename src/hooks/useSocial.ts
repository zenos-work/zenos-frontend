import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { articleKeys } from './useArticles'
import type { ArticleList } from '../types'

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
      qc.setQueryData(articleKeys.detail(articleId), (old: any) =>
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

export const useBookmarks = (page = 1) =>
  useQuery({
    queryKey: ['bookmarks', page],
    queryFn:  () =>
      api.get<{ bookmarks: ArticleList[] }>('/api/social/bookmarks', {
        params: { page },
      }).then(r => r.data.bookmarks),
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
    },
  })
}
