import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type WorkflowCostRate = {
  id: string
  org_id?: string
  node_type_id: string
  cost_model?: string
  rate_microcents?: number
  unit_label?: string
  currency?: string
}

export type WorkflowRunCost = {
  id: string
  run_id: string
  workflow_id: string
  cost_microcents: number
  created_at?: string
}

export type WorkflowCostSummary = {
  workflow_id: string
  total_cost_microcents: number
  total_runs_costed?: number
  avg_run_cost_microcents?: number
}

const workflowCostKeys = {
  all: ['workflow-costs'] as const,
  rates: (orgId: string) => [...workflowCostKeys.all, 'rates', orgId] as const,
  run: (runId: string) => [...workflowCostKeys.all, 'run', runId] as const,
  workflow: (workflowId: string, page: number, limit: number) => [...workflowCostKeys.all, 'workflow', workflowId, page, limit] as const,
  summaries: (orgId: string) => [...workflowCostKeys.all, 'summaries', orgId] as const,
  monthly: (orgId: string, page: number, limit: number) => [...workflowCostKeys.all, 'monthly', orgId, page, limit] as const,
}

export const useWorkflowCostRates = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: workflowCostKeys.rates(orgId),
    enabled,
    queryFn: () => api.get<{ rates: WorkflowCostRate[] }>('/api/workflow-costs/rates', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useCreateWorkflowCostRate = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { node_type_id: string; cost_model: string; rate_microcents: number; unit_label?: string; currency?: string; org_id?: string }) =>
      api.post<{ id: string }>('/api/workflow-costs/rates', { ...payload, org_id: payload.org_id ?? orgId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowCostKeys.rates(orgId) }),
  })
}

export const useUpdateWorkflowCostRate = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rateId, payload }: { rateId: string; payload: Partial<WorkflowCostRate> }) => api.put<{ id: string }>(`/api/workflow-costs/rates/${rateId}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowCostKeys.rates(orgId) }),
  })
}

export const useDeleteWorkflowCostRate = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rateId: string) => api.delete<{ deleted: boolean }>(`/api/workflow-costs/rates/${rateId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowCostKeys.rates(orgId) }),
  })
}

export const useWorkflowRunCosts = (runId: string, enabled = true) =>
  useQuery({
    queryKey: workflowCostKeys.run(runId),
    enabled: enabled && !!runId,
    queryFn: () => api.get<{ costs: WorkflowRunCost[] }>(`/api/workflow-costs/runs/${runId}`).then((r) => r.data),
  })

export const useWorkflowCostHistory = (workflowId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: workflowCostKeys.workflow(workflowId, page, limit),
    enabled: enabled && !!workflowId,
    queryFn: () => api.get<{ costs: WorkflowRunCost[]; page: number; limit: number }>(`/api/workflow-costs/workflows/${workflowId}`, { params: { page, limit } }).then((r) => r.data),
  })

export const useWorkflowCostSummaries = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: workflowCostKeys.summaries(orgId),
    enabled,
    queryFn: () => api.get<{ summaries: WorkflowCostSummary[] }>('/api/workflow-costs/summaries', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useWorkflowMonthlyRollups = (orgId: string, enabled = true, page = 1, limit = 12) =>
  useQuery({
    queryKey: workflowCostKeys.monthly(orgId, page, limit),
    enabled,
    queryFn: () => api.get<{ items: Array<Record<string, unknown>>; page: number; limit: number }>('/api/workflow-costs/monthly', { params: { org_id: orgId, page, limit } }).then((r) => r.data),
  })

export const useSetWorkflowBudgetCap = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { year_month: string; budget_cap_microcents: number; org_id?: string }) =>
      api.put<{ ok: boolean }>('/api/workflow-costs/budget-cap', { ...payload, org_id: payload.org_id ?? orgId }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowCostKeys.monthly(orgId, 1, 12).slice(0, 3) })
      qc.invalidateQueries({ queryKey: workflowCostKeys.summaries(orgId) })
    },
  })
}
