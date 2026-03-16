import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Comment } from '../types'

const commentKeys = {
  forArticle: (articleId: string) => ['comments', articleId] as const,
}

export const useComments = (articleId: string) =>
  useQuery({
    queryKey: commentKeys.forArticle(articleId),
    queryFn:  () =>
      api.get<{ comments: Comment[] }>('/api/comments', {
        params: { article_id: articleId },
      }).then(r => r.data.comments),
    enabled: !!articleId,
  })

export const usePostComment = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { content: string; parent_id?: string }) =>
      api.post<{ id: string }>('/api/comments', {
        article_id: articleId,
        ...data,
      }).then(r => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: commentKeys.forArticle(articleId) }),
  })
}

export const useEditComment = (commentId: string, articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) =>
      api.put(`/api/comments/${commentId}`, { content }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: commentKeys.forArticle(articleId) }),
  })
}

export const useDeleteComment = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) =>
      api.delete(`/api/comments/${commentId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: commentKeys.forArticle(articleId) }),
  })
}
