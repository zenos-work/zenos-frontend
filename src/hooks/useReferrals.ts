import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type ReferralStats = {
  code?: string
  total_clicks?: number
  total_signups?: number
  total_conversions?: number
}

const referralKeys = {
  all: ['referrals'] as const,
  code: () => [...referralKeys.all, 'code'] as const,
  stats: () => [...referralKeys.all, 'stats'] as const,
  events: (page: number, limit: number) => [...referralKeys.all, 'events', page, limit] as const,
}

export const useReferralCode = (enabled = true) =>
  useQuery({
    queryKey: referralKeys.code(),
    enabled,
    queryFn: () => api.get<{ code?: string }>('/api/referrals').then((r) => r.data),
  })

export const useGenerateCode = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ code: string }>('/api/referrals').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: referralKeys.code() })
      qc.invalidateQueries({ queryKey: referralKeys.stats() })
    },
  })
}

export const useTrackReferral = () =>
  useMutation({
    mutationFn: (payload: { code: string; event_type: string; referred_user_id?: string; metadata?: unknown }) =>
      api.post<{ id: string }>('/api/referrals/track', payload).then((r) => r.data),
  })

export const useReferralEvents = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: referralKeys.events(page, limit),
    enabled,
    queryFn: () => api.get<{ events: Array<Record<string, unknown>>; page: number; limit: number }>('/api/referrals/events', { params: { page, limit } }).then((r) => r.data),
  })

export const useReferralStats = (enabled = true) =>
  useQuery({
    queryKey: referralKeys.stats(),
    enabled,
    queryFn: () => api.get<ReferralStats>('/api/referrals/stats').then((r) => r.data),
  })
