import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export interface Series {
  id: string
  author_id: string
  name: string
  description?: string
  cover_image_url?: string
  created_at: string
  updated_at: string
}

export interface ArticleSeriesInfo {
  id: string
  name: string
  part: number
  total: number
  description?: string
  cover_image_url?: string
}

export function useSeries() {
  return useQuery({
    queryKey: ['series'],
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
      void queryClient.invalidateQueries({ queryKey: ['series'] })
    },
  })
}

export function useAssignArticleToSeries() {
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
    queryKey: ['article-series', articleId],
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
