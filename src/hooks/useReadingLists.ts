import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { ReadingList, ReadingListItem } from '../types'

type ReadingListsResponse = {
  reading_lists: ReadingList[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

type ReadingListDetail = ReadingList & {
  items: ReadingListItem[]
}

const readingListKeys = {
  all: ['reading-lists'] as const,
  list: (page: number, limit: number) => [...readingListKeys.all, 'list', page, limit] as const,
  detail: (id: string) => [...readingListKeys.all, 'detail', id] as const,
}

export const useReadingLists = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: readingListKeys.list(page, limit),
    enabled,
    queryFn: () => api.get<ReadingListsResponse>('/api/reading-lists', { params: { page, limit } }).then((r) => r.data),
  })

export const useReadingList = (listId: string, enabled = true) =>
  useQuery({
    queryKey: readingListKeys.detail(listId),
    enabled: enabled && !!listId,
    queryFn: () => api.get<ReadingListDetail>(`/api/reading-lists/${listId}`).then((r) => r.data),
  })

export const useCreateReadingList = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; description?: string; cover_image_url?: string; is_public?: boolean }) =>
      api.post<{ id: string }>('/api/reading-lists', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readingListKeys.all })
    },
  })
}

export const useUpdateReadingList = (listId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; description?: string; cover_image_url?: string; is_public?: boolean }) =>
      api.put<{ status: string }>(`/api/reading-lists/${listId}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readingListKeys.detail(listId) })
      qc.invalidateQueries({ queryKey: readingListKeys.all })
    },
  })
}

export const useDeleteReadingList = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (listId: string) => api.delete<{ status: string }>(`/api/reading-lists/${listId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readingListKeys.all })
    },
  })
}

export const useAddToReadingList = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, articleId, note }: { listId: string; articleId: string; note?: string }) =>
      api.post<{ id: string }>(`/api/reading-lists/${listId}/articles/${articleId}`, { note }).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: readingListKeys.detail(variables.listId) })
      qc.invalidateQueries({ queryKey: readingListKeys.all })
    },
  })
}

export const useRemoveFromReadingList = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ listId, articleId }: { listId: string; articleId: string }) =>
      api.delete<{ status: string }>(`/api/reading-lists/${listId}/articles/${articleId}`).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: readingListKeys.detail(variables.listId) })
      qc.invalidateQueries({ queryKey: readingListKeys.all })
    },
  })
}
