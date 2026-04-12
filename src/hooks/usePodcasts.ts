import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type PodcastShow = {
  id: string
  owner_id: string
  org_id?: string
  title: string
  slug: string
  description?: string
  cover_image_url?: string
  rss_feed_url?: string
}

export type PodcastEpisode = {
  id: string
  show_id: string
  title: string
  description?: string
  audio_url?: string
  duration_seconds?: number
  episode_number?: number
  transcript_article_id?: string
  published_at?: string
}

const podcastKeys = {
  all: ['podcasts'] as const,
  list: (page: number, limit: number) => [...podcastKeys.all, 'list', page, limit] as const,
  detail: (podcastId: string) => [...podcastKeys.all, 'detail', podcastId] as const,
  episodes: (podcastId: string, page: number, limit: number) => [...podcastKeys.all, 'episodes', podcastId, page, limit] as const,
}

export const usePodcasts = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: podcastKeys.list(page, limit),
    enabled,
    queryFn: () => api.get<{ shows: PodcastShow[]; page: number; limit: number }>('/api/podcasts', { params: { page, limit } }).then((r) => r.data),
  })

export const usePodcast = (podcastId: string, enabled = true) =>
  useQuery({
    queryKey: podcastKeys.detail(podcastId),
    enabled: enabled && !!podcastId,
    queryFn: () => api.get<PodcastShow>(`/api/podcasts/${podcastId}`).then((r) => r.data),
  })

export const useCreatePodcast = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { title: string; slug: string; org_id?: string; description?: string; cover_image_url?: string; rss_feed_url?: string }) =>
      api.post<{ id: string }>('/api/podcasts', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: podcastKeys.all }),
  })
}

export const useUpdatePodcast = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ podcastId, payload }: { podcastId: string; payload: Partial<PodcastShow> }) =>
      api.put<{ id: string }>(`/api/podcasts/${podcastId}`, payload).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: podcastKeys.detail(vars.podcastId) })
      qc.invalidateQueries({ queryKey: podcastKeys.all })
    },
  })
}

export const useDeletePodcast = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (podcastId: string) => api.delete<{ deleted: boolean }>(`/api/podcasts/${podcastId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: podcastKeys.all }),
  })
}

export const usePodcastEpisodes = (podcastId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: podcastKeys.episodes(podcastId, page, limit),
    enabled: enabled && !!podcastId,
    queryFn: () => api.get<{ episodes: PodcastEpisode[]; page: number; limit: number }>(`/api/podcasts/${podcastId}/episodes`, { params: { page, limit } }).then((r) => r.data),
  })

export const useCreateEpisode = (podcastId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      title: string
      audio_url?: string
      description?: string
      duration_seconds?: number
      episode_number?: number
      transcript_article_id?: string
      published_at?: string
    }) => api.post<{ id: string }>(`/api/podcasts/${podcastId}/episodes`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: podcastKeys.episodes(podcastId, 1, 20).slice(0, 3) }),
  })
}

export const useUpdateEpisode = (podcastId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ episodeId, payload }: { episodeId: string; payload: Partial<PodcastEpisode> }) =>
      api.put<{ id: string }>(`/api/podcasts/${podcastId}/episodes/${episodeId}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: podcastKeys.episodes(podcastId, 1, 20).slice(0, 3) }),
  })
}

export const useDeleteEpisode = (podcastId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (episodeId: string) => api.delete<{ deleted: boolean }>(`/api/podcasts/${podcastId}/episodes/${episodeId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: podcastKeys.episodes(podcastId, 1, 20).slice(0, 3) }),
  })
}
