import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { PaginationMeta } from '../types'
import type { ReadingHistoryItem } from '../lib/readingHistory'

type ReadingHistoryResponse = {
  items: ReadingHistoryItem[]
  pagination: PaginationMeta
}

type UpsertReadingHistoryPayload = {
  article_id: string
  slug: string
  title: string
  subtitle?: string
  author_name?: string
  cover_image_url?: string
  read_time_minutes: number
  progress: number
  last_read_at?: string
}

export const useReadingHistory = (page = 1, limit = 50, enabled = true) =>
  useQuery({
    queryKey: ['users', 'me', 'reading-history', page, limit],
    enabled,
    queryFn: () =>
      api.get<ReadingHistoryResponse>('/api/users/me/reading-history', { params: { page, limit } }).then((r) => r.data),
  })

export const useUpsertReadingHistoryItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertReadingHistoryPayload) =>
      api.put('/api/users/me/reading-history', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me', 'reading-history'] })
    },
  })
}

export const useRemoveReadingHistoryItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (articleId: string) => api.delete(`/api/users/me/reading-history/${articleId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me', 'reading-history'] })
    },
  })
}

export const useClearReadingHistory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/api/users/me/reading-history'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me', 'reading-history'] })
    },
  })
}
