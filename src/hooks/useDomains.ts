import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type CustomDomain = {
  id: string
  domain: string
  resource_type: string
  verification_status: string
  verification_method: string
  verification_token: string
  ssl_status: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

const domainKeys = {
  all: ['domains'] as const,
  list: (page: number, limit: number) => [...domainKeys.all, 'list', page, limit] as const,
}

export const useMyDomains = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: domainKeys.list(page, limit),
    enabled,
    queryFn: () => api.get<{ domains: CustomDomain[]; pagination: Pagination }>('/api/domains', { params: { page, limit } }).then((r) => r.data),
  })

export const useAddDomain = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { domain: string; resource_type?: string; verification_method?: string; org_id?: string; resource_id?: string }) =>
      api.post<CustomDomain>('/api/domains', {
        domain: payload.domain,
        resource_type: payload.resource_type ?? 'blog',
        verification_method: payload.verification_method ?? 'cname',
        org_id: payload.org_id,
        resource_id: payload.resource_id,
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: domainKeys.all }),
  })
}

export const useDeleteDomain = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (domainId: string) => api.delete<{ status: string }>(`/api/domains/${domainId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: domainKeys.all }),
  })
}

export const useVerifyDomain = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (domainId: string) => api.post<CustomDomain>(`/api/domains/${domainId}/verify`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: domainKeys.all }),
  })
}
