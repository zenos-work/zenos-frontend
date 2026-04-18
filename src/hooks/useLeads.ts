import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type LeadForm = {
  id: string
  org_id: string
  name: string
  slug?: string
}

export type LeadScoreRule = {
  id: string
  org_id: string
  name: string
  trigger_event?: string
  score_delta?: number
  is_active?: boolean
}

export type LeadContact = {
  id: string
  org_id: string
  email: string
  first_name?: string
  last_name?: string
  status?: string
  score?: number
}

const leadsKeys = {
  all: ['leads'] as const,
  forms: (orgId: string) => [...leadsKeys.all, 'forms', orgId] as const,
  scoreRules: (orgId: string) => [...leadsKeys.all, 'score-rules', orgId] as const,
  contacts: (orgId: string, page: number, limit: number) => [...leadsKeys.all, 'contacts', orgId, page, limit] as const,
}

export const useLeadForms = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: leadsKeys.forms(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ forms: LeadForm[] }>('/api/leads/forms', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useCreateLeadForm = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { org_id: string; name: string; slug: string; description?: string }) => api.post<{ id: string }>('/api/leads/forms', payload).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: leadsKeys.forms(vars.org_id) }),
  })
}

export const useDeleteLeadForm = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ formId }: { formId: string; orgId: string }) => api.delete<{ deleted: boolean }>(`/api/leads/forms/${formId}`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: leadsKeys.forms(vars.orgId) }),
  })
}

export const useLeadScoreRules = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: leadsKeys.scoreRules(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ rules: LeadScoreRule[] }>('/api/leads/score-rules', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useCreateLeadScoreRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { org_id: string; name: string; trigger_event: string; score_delta: number }) => api.post<{ id: string }>('/api/leads/score-rules', payload).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: leadsKeys.scoreRules(vars.org_id) }),
  })
}

export const useDeleteLeadScoreRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId }: { ruleId: string; orgId: string }) => api.delete<{ deleted: boolean }>(`/api/leads/score-rules/${ruleId}`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: leadsKeys.scoreRules(vars.orgId) }),
  })
}

export const useLeadContacts = (orgId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: leadsKeys.contacts(orgId, page, limit),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ leads: LeadContact[]; page: number; limit: number }>('/api/leads', { params: { org_id: orgId, page, limit } }).then((r) => r.data),
  })

export const useCreateLeadContact = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { org_id: string; email: string; first_name?: string; last_name?: string }) => api.post<{ id: string }>('/api/leads', payload).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: leadsKeys.contacts(vars.org_id, 1, 20).slice(0, 3) }),
  })
}

export const useDeleteLeadContact = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contactId }: { contactId: string; orgId: string }) => api.delete<{ deleted: boolean }>(`/api/leads/${contactId}`).then((r) => r.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: leadsKeys.contacts(vars.orgId, 1, 20).slice(0, 3) }),
  })
}
