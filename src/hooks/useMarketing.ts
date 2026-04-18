import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type MarketingChannel = {
  id: string
  org_id: string
  name: string
  channel_type?: string
  is_active?: boolean
}

export type ScheduledPublication = {
  id: string
  article_id?: string
  status?: string
  scheduled_at?: string
}

export type MarketingCampaign = {
  id: string
  org_id: string
  name: string
  objective?: string
  status?: string
}

const marketingKeys = {
  all: ['marketing'] as const,
  channels: (orgId: string) => [...marketingKeys.all, 'channels', orgId] as const,
  scheduled: (orgId: string, page: number, limit: number) => [...marketingKeys.all, 'scheduled', orgId, page, limit] as const,
  campaigns: (orgId: string, page: number, limit: number) => [...marketingKeys.all, 'campaigns', orgId, page, limit] as const,
}

export const useMarketingChannels = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: marketingKeys.channels(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ channels: MarketingChannel[] }>('/api/marketing/channels', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useCreateMarketingChannel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { org_id: string; name: string; channel_type: string; config?: unknown }) =>
      api.post<{ id: string }>('/api/marketing/channels', payload).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: marketingKeys.channels(vars.org_id) }),
  })
}

export const useDeleteMarketingChannel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ channelId }: { channelId: string; orgId: string }) =>
      api.delete<{ deleted: boolean }>(`/api/marketing/channels/${channelId}`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: marketingKeys.channels(vars.orgId) }),
  })
}

export const useScheduledPublications = (orgId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: marketingKeys.scheduled(orgId, page, limit),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ schedules: ScheduledPublication[]; page: number; limit: number }>('/api/marketing/scheduled', { params: { org_id: orgId, page, limit } }).then((r) => r.data),
  })

export const useCreateScheduledPublication = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { article_id: string; scheduled_at: string; timezone?: string }) =>
      api.post<{ id: string }>('/api/marketing/scheduled', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: marketingKeys.all }),
  })
}

export const useAbTests = (orgId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: marketingKeys.campaigns(orgId, page, limit),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ campaigns: MarketingCampaign[]; page: number; limit: number }>('/api/marketing/campaigns', { params: { org_id: orgId, page, limit } }).then((r) => r.data),
  })

export const useCreateAbTest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { org_id: string; name: string; objective?: string; status?: string }) => api.post<{ id: string }>('/api/marketing/campaigns', payload).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: marketingKeys.campaigns(vars.org_id, 1, 20).slice(0, 3) }),
  })
}

export const useDeleteAbTest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignId }: { campaignId: string; orgId: string }) => api.delete<{ deleted: boolean }>(`/api/marketing/campaigns/${campaignId}`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: marketingKeys.campaigns(vars.orgId, 1, 20).slice(0, 3) }),
  })
}
