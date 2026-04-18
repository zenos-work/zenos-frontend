import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type OrgQuota = {
  org_id: string
  year_month: string
  exceeded?: boolean
  remaining_microcents?: number
  used_microcents?: number
  budget_cap_microcents?: number
}

export type UsageAlertRule = {
  id: string
  org_id: string
  name: string
  alert_type: string
  threshold_value?: number
  comparison?: string
  is_active?: boolean
}

const usageKeys = {
  all: ['usage'] as const,
  quota: (orgId: string, yearMonth: string) => [...usageKeys.all, 'quota', orgId, yearMonth] as const,
  export: (orgId: string) => [...usageKeys.all, 'export', orgId] as const,
  alerts: (orgId: string) => [...usageKeys.all, 'alerts', orgId] as const,
}

export const useOrgQuota = (orgId: string, yearMonth: string, enabled = true) =>
  useQuery({
    queryKey: usageKeys.quota(orgId, yearMonth),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<OrgQuota>('/api/usage/quota', { params: { org_id: orgId, year_month: yearMonth } }).then((r) => r.data),
  })

export const useUsageExport = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: usageKeys.export(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ rows: Array<Record<string, unknown>>; count: number }>('/api/usage/export', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useUsageAlerts = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: usageKeys.alerts(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ rules: UsageAlertRule[] }>('/api/usage/alerts', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useCreateAlertRule = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; alert_type: string; threshold_value: number; comparison?: string; org_id?: string }) =>
      api.post<{ id: string }>('/api/usage/alerts', { ...payload, org_id: payload.org_id ?? orgId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: usageKeys.alerts(orgId) }),
  })
}

export const useUpdateAlertRule = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: string; payload: Partial<UsageAlertRule> }) => api.put<{ id: string }>(`/api/usage/alerts/${ruleId}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: usageKeys.alerts(orgId) }),
  })
}

export const useDeleteAlertRule = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => api.delete<{ deleted: boolean }>(`/api/usage/alerts/${ruleId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: usageKeys.alerts(orgId) }),
  })
}

export const useToggleAlertRule = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => api.post<{ id: string }>(`/api/usage/alerts/${ruleId}/toggle`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: usageKeys.alerts(orgId) }),
  })
}
