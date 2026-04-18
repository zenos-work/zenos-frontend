import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

// ── Query key factory ──────────────────────────────────────────────────────
export const seriesKeys = {
  all: ['series'] as const,
  mine: () => [...seriesKeys.all, 'mine'] as const,
  article: (id: string) => [...seriesKeys.all, 'article', id] as const,
}

export interface Series {
  id: string
  author_id: string
  name: string
  description?: string
  cover_image_url?: string
  created_at: string
  updated_at: string
  article_count?: number
}

export interface ArticleSeriesPart {
  part: number
  slug: string
}

export interface ArticleSeriesInfo {
  id: string
  name: string
  part: number
  total: number
  description?: string
  cover_image_url?: string
  next_article_slug?: string
  prev_article_slug?: string
  parts?: ArticleSeriesPart[]
}

export function useSeries() {
  return useQuery({
    queryKey: seriesKeys.mine(),
    queryFn: async () => {
      const res = await api.get<{ items: Series[] }>('/api/series?limit=100')
      return res.data.items ?? []
    },
  })
}

export function useCreateSeries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; cover_image_url?: string }) => {
      const res = await api.post<{ series: Series }>('/api/series', data)
      return res.data.series
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: seriesKeys.all })
    },
  })
}

export function useAssignArticleToSeries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      articleId,
      seriesId,
      partNumber,
    }: {
      articleId: string
      seriesId: string
      partNumber: number
    }) => {
      const res = await api.post(
        `/api/series/${seriesId}/articles/${articleId}`,
        { series_id: seriesId, part_number: partNumber },
      )
      return res.data
    },
    onSuccess: (_, { articleId }) => {
      void queryClient.invalidateQueries({ queryKey: seriesKeys.all })
      void queryClient.invalidateQueries({ queryKey: seriesKeys.article(articleId) })
    },
  })
}

export function useRemoveArticleFromSeries() {
  return useMutation({
    mutationFn: async ({
      articleId,
      seriesId,
    }: {
      articleId: string
      seriesId: string
    }) => {
      const res = await api.delete(`/api/series/${seriesId}/articles/${articleId}`)
      return res.data
    },
  })
}

export function useArticleSeries(articleId: string) {
  return useQuery({
    queryKey: seriesKeys.article(articleId),
    queryFn: async () => {
      try {
        const res = await api.get<{ series: ArticleSeriesInfo }>(`/api/articles/${articleId}/series`)
        return res.data.series ?? null
      } catch {
        return null
      }
    },
    enabled: !!articleId,
  })
}
