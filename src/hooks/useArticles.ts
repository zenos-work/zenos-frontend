import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { ArticleList, ArticleDetail, PaginatedResponse, ArticleContentType } from '../types'

// ── Query key factory ──────────────────────────────────────────────────────
export const articleKeys = {
  all:      ['articles'] as const,
  lists:    () => [...articleKeys.all, 'list'] as const,
  list:     (f: object) => [...articleKeys.lists(), f] as const,
  detail:   (id: string) => [...articleKeys.all, 'detail', id] as const,
  myList:   () => [...articleKeys.all, 'mine'] as const,
}

// ── Queries ────────────────────────────────────────────────────────────────
export const useArticles = (params: {
  page?: number
  tag?: string
  search?: string
  content_type?: ArticleContentType
  sort?: 'newest' | 'trending' | 'recommended'
} = {}) =>
  useQuery({
    queryKey: articleKeys.list(params),
    queryFn:  () =>
      api.get<PaginatedResponse<ArticleList>>('/api/articles', { params })
         .then(r => r.data),
  })

export const useArticle = (idOrSlug: string) =>
  useQuery({
    queryKey: articleKeys.detail(idOrSlug),
    queryFn:  () =>
      api.get<{ article: ArticleDetail }>(`/api/articles/${idOrSlug}`)
         .then(r => r.data.article),
    enabled: !!idOrSlug,
  })

export const useAuthorArticles = (
  authorId: string,
  params: {
    page?: number
    limit?: number
    status?: string
  } = {},
) =>
  useQuery({
    queryKey: [...articleKeys.all, 'author', authorId, params] as const,
    queryFn: () =>
      api
        .get<PaginatedResponse<ArticleList>>(`/api/articles/author/${authorId}`, { params })
        .then((r) => r.data),
    enabled: !!authorId,
  })

// Phase 2: Related articles by shared tags
export const useRelatedArticles = (articleId: string, limit: number = 5) =>
  useQuery({
    queryKey: [...articleKeys.all, 'related', articleId] as const,
    queryFn: () =>
      api
        .get<{ related: ArticleList[]; count: number }>(`/api/articles/${articleId}/related`, { params: { limit } })
        .then((r) => r.data),
    enabled: !!articleId,
    staleTime: 60000,
  })

// My drafts + library — all my articles regardless of status
export const useMyArticles = () =>
  useQuery({
    queryKey: articleKeys.myList(),
    queryFn:  () =>
      api.get<PaginatedResponse<ArticleList>>('/api/articles/mine')
         .then(r => r.data),
  })

// ── Mutations ─────────────────────────────────────────────────────────────
export const useCreateArticle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      title:            string
      content:          string
      subtitle?:        string
      content_type?:    ArticleContentType
      cover_image_url?: string
      reading_level?:   'Beginner' | 'Intermediate' | 'Advanced'
      last_verified_at?: string
      expires_at?: string
      seo_title?: string
      seo_description?: string
      canonical_url?: string
      og_image_url?: string
      seo_schema_type?: 'Article' | 'TechArticle' | 'HowTo'
      citations?: string[]
      tag_ids?:         string[]
    }) =>
      api.post<{ article: ArticleDetail }>('/api/articles', data)
         .then(r => r.data.article),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.lists() })
      qc.invalidateQueries({ queryKey: articleKeys.myList() })
    },
  })
}

export const useUpdateArticle = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<{
      title:            string
      content:          string
      subtitle:         string
      content_type:     ArticleContentType
      cover_image_url:  string
      reading_level:    'Beginner' | 'Intermediate' | 'Advanced'
      last_verified_at: string
      expires_at: string
      seo_title: string
      seo_description: string
      canonical_url: string
      og_image_url: string
      seo_schema_type: 'Article' | 'TechArticle' | 'HowTo'
      citations: string[]
      tag_ids:          string[]
    }>) =>
      api.put<{ article: ArticleDetail }>(`/api/articles/${articleId}`, data)
         .then(r => r.data.article),
    onSuccess: (article) => {
      qc.setQueryData(articleKeys.detail(articleId), article)
      qc.setQueryData(articleKeys.detail(article.slug), article)
      qc.invalidateQueries({ queryKey: articleKeys.myList() })
    },
  })
}

export const useSubmitArticle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (articleId: string) =>
      api.post<{ status: string }>(`/api/articles/${articleId}/submit`)
         .then(r => r.data),
    onSuccess: (_result, articleId) => {
      qc.invalidateQueries({ queryKey: articleKeys.detail(articleId) })
      qc.invalidateQueries({ queryKey: articleKeys.myList() })
    },
  })
}

export const useApproveArticle = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/api/articles/${articleId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.detail(articleId) })
      qc.invalidateQueries({ queryKey: ['admin', 'queue'] })
    },
  })
}

export const useRejectArticle = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (note: string) =>
      api.post(`/api/articles/${articleId}/reject`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.detail(articleId) })
      qc.invalidateQueries({ queryKey: ['admin', 'queue'] })
    },
  })
}

export const usePublishArticle = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/api/articles/${articleId}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.detail(articleId) })
      qc.invalidateQueries({ queryKey: articleKeys.lists() })
      qc.invalidateQueries({ queryKey: ['admin', 'queue'] })
    },
  })
}

export const useDeleteArticle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/articles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.lists() })
      qc.invalidateQueries({ queryKey: articleKeys.myList() })
    },
  })
}

export const useDuplicateArticle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (articleId: string) =>
      api.post<{ article?: ArticleDetail }>(`/api/articles/${articleId}/duplicate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.myList() })
      qc.invalidateQueries({ queryKey: articleKeys.lists() })
    },
  })
}

export const useScheduleArticle = () => {
  return useMutation({
    mutationFn: ({ articleId, scheduledAt, timezone = 'UTC' }: { articleId: string; scheduledAt: string; timezone?: string }) =>
      api.post('/api/marketing/scheduled', {
        article_id: articleId,
        scheduled_at: scheduledAt,
        timezone,
      }).then((r) => r.data),
  })
}

export const useAddCoauthor = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      api.post(`/api/articles/${articleId}/coauthors`, { user_id: userId }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.detail(articleId) })
      qc.invalidateQueries({ queryKey: articleKeys.myList() })
    },
  })
}
