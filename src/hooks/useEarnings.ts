import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export const earningsKeys = {
  all: ['earnings'] as const,
  me: (page: number, limit: number) => [...earningsKeys.all, 'me', page, limit] as const,
  payouts: (page: number, limit: number) => [...earningsKeys.all, 'payouts', page, limit] as const,
  breakdown: (periodStart: string) => [...earningsKeys.all, 'breakdown', periodStart] as const,
  tips: (page: number, limit: number) => [...earningsKeys.all, 'tips', page, limit] as const,
}

export const useMyEarnings = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: earningsKeys.me(page, limit),
    enabled,
    queryFn: () => api.get('/api/earnings/me', { params: { page, limit } }).then((r) => r.data),
  })

export const useMyPayouts = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: earningsKeys.payouts(page, limit),
    enabled,
    queryFn: () => api.get('/api/earnings/me/payouts', { params: { page, limit } }).then((r) => r.data),
  })

export const useEarningsBreakdown = (periodStart: string, enabled = true) =>
  useQuery({
    queryKey: earningsKeys.breakdown(periodStart),
    enabled,
    queryFn: () => api.get('/api/earnings/me/breakdown', { params: { period_start: periodStart } }).then((r) => r.data),
  })

export const useRequestPayout = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { amount_cents: number; currency?: string; payout_method?: string; period_start?: string; period_end?: string }) =>
      api.post('/api/earnings/me/payouts/request', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: earningsKeys.all })
    },
  })
}

export const useSendTip = (articleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { author_id: string; amount_cents: number; currency?: string; message?: string; is_anonymous?: boolean }) =>
      api.post(`/api/tips/${articleId}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: earningsKeys.all })
    },
  })
}

export const useReceivedTips = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: earningsKeys.tips(page, limit),
    enabled,
    queryFn: () => api.get('/api/tips/me/received', { params: { page, limit } }).then((r) => r.data),
  })
