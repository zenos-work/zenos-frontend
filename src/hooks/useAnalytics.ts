import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type AnalyticsDateRange = {
  start: string
  end: string
}

export type AnalyticsDashboardSummary = {
  events: Array<{ category: string; count: number }>
  conversions: Array<{ goal: string; count: number; total_value_cents: number }>
  experiments: Array<{ id: string; name: string; status?: string; variants: Array<{ id: string; name: string; impressions: number; conversions: number }> }>
}

const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (orgId: string, start: string, end: string) => [...analyticsKeys.all, 'dashboard', orgId, start, end] as const,
  conversions: (orgId: string, start: string, end: string) => [...analyticsKeys.all, 'conversions', orgId, start, end] as const,
  experiments: (orgId: string) => [...analyticsKeys.all, 'experiments', orgId] as const,
  goals: (orgId: string) => [...analyticsKeys.all, 'goals', orgId] as const,
  events: (orgId: string, page: number, limit: number) => [...analyticsKeys.all, 'events', orgId, page, limit] as const,
}

export const useAnalyticsDashboard = (dateRange: AnalyticsDateRange, orgId: string, enabled = true) =>
  useQuery({
    queryKey: analyticsKeys.dashboard(orgId, dateRange.start, dateRange.end),
    enabled: enabled && !!orgId && !!dateRange.start && !!dateRange.end,
    queryFn: async (): Promise<AnalyticsDashboardSummary> => {
      const [events, conversions, experiments] = await Promise.all([
        api.get<{ breakdown: Array<{ category: string; count: number }> }>('/api/analytics/dashboard/events', {
          params: { org_id: orgId, start: dateRange.start, end: dateRange.end },
        }),
        api.get<{ conversions: Array<{ goal: string; count: number; total_value_cents: number }> }>('/api/analytics/dashboard/conversions', {
          params: { org_id: orgId, start: dateRange.start, end: dateRange.end },
        }),
        api.get<{ experiments: Array<{ id: string; name: string; status?: string; variants: Array<{ id: string; name: string; impressions: number; conversions: number }> }> }>('/api/analytics/dashboard/experiments', {
          params: { org_id: orgId },
        }),
      ])

      return {
        events: events.data.breakdown,
        conversions: conversions.data.conversions,
        experiments: experiments.data.experiments,
      }
    },
  })

export const useAnalyticsConversions = (dateRange: AnalyticsDateRange, orgId: string, enabled = true) =>
  useQuery({
    queryKey: analyticsKeys.conversions(orgId, dateRange.start, dateRange.end),
    enabled: enabled && !!orgId && !!dateRange.start && !!dateRange.end,
    queryFn: () =>
      api
        .get<{ conversions: Array<{ goal: string; count: number; total_value_cents: number }> }>('/api/analytics/dashboard/conversions', {
          params: { org_id: orgId, start: dateRange.start, end: dateRange.end },
        })
        .then((r) => r.data),
  })

export const useAnalyticsExperiments = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: analyticsKeys.experiments(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ experiments: unknown[] }>('/api/analytics/experiments', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useAnalyticsGoals = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: analyticsKeys.goals(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ goals: unknown[] }>('/api/analytics/goals', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useCreateGoal = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      name: string
      goal_type: string
      target_event_category?: string
      target_event_action?: string
      target_resource_id?: string
      value_cents?: number
      is_active?: boolean
    }) =>
      api
        .post<{ id: string }>('/api/analytics/goals', {
          org_id: orgId,
          ...payload,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: analyticsKeys.goals(orgId) })
      qc.invalidateQueries({ queryKey: analyticsKeys.dashboard(orgId, '', '').slice(0, 3) })
    },
  })
}

export const useAnalyticsEvents = (
  params: { orgId: string; page?: number; limit?: number },
  enabled = true,
) => {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  return useQuery({
    queryKey: analyticsKeys.events(params.orgId, page, limit),
    enabled: enabled && !!params.orgId,
    queryFn: () =>
      api
        .get<{ events: unknown[]; page: number; limit: number }>('/api/analytics/events', {
          params: { org_id: params.orgId, page, limit },
        })
        .then((r) => r.data),
  })
}
