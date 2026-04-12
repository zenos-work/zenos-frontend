import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

export type OrgApiKey = {
  id: string
  name: string
  key_prefix: string
  scopes: string
  created_at: string
  revoked_at?: string
}

export type OrgAuditEntry = {
  id: string
  action: string
  actor_id?: string
  resource?: string
  resource_id?: string
  created_at: string
  payload?: string
}

export type OrgSubdomainConfig = {
  org_id: string
  subdomain: string
  custom_domain?: string
  is_active?: boolean
  status?: string
}

export type OrgSsoConfig = {
  id: string
  org_id: string
  provider_type?: string
  protocol?: string
  issuer_url?: string
  metadata_url?: string
  entity_id?: string
  acs_url?: string
  slo_url?: string
  client_id?: string
  allowed_domains?: string
  is_active?: boolean
  enforce_sso?: boolean
  jit_provisioning?: boolean
  default_role?: string
}

export type OrgVaultSecret = {
  id: string
  org_id: string
  name: string
  secret_type?: string
  provider?: string
  key_ref?: string
  created_at: string
  updated_at?: string
}

const orgInfraKeys = {
  all: ['org-infra'] as const,
  apiKeys: (orgId: string, page: number, limit: number) => [...orgInfraKeys.all, 'api-keys', orgId, page, limit] as const,
  auditLog: (orgId: string, page: number, limit: number) => [...orgInfraKeys.all, 'audit-log', orgId, page, limit] as const,
  subdomain: (orgId: string) => [...orgInfraKeys.all, 'subdomain', orgId] as const,
  ssoConfigs: (orgId: string) => [...orgInfraKeys.all, 'sso-configs', orgId] as const,
  vaultSecrets: (orgId: string) => [...orgInfraKeys.all, 'vault-secrets', orgId] as const,
}

export const useOrgApiKeys = (orgId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: orgInfraKeys.apiKeys(orgId, page, limit),
    enabled: enabled && !!orgId,
    queryFn: () =>
      api
        .get<{ api_keys: OrgApiKey[]; pagination: Pagination }>(`/api/organizations/${orgId}/api-keys`, { params: { page, limit } })
        .then((r) => r.data),
  })

export const useCreateApiKey = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; scopes?: string[] }) =>
      api
        .post<{ id: string; key: string; key_prefix: string; name: string }>(`/api/organizations/${orgId}/api-keys`, {
          name: payload.name,
          scopes: JSON.stringify(payload.scopes ?? ['read']),
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgInfraKeys.apiKeys(orgId, 1, 20).slice(0, 3) })
    },
  })
}

export const useRevokeApiKey = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (keyId: string) => api.delete<{ status: string }>(`/api/organizations/${orgId}/api-keys/${keyId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgInfraKeys.apiKeys(orgId, 1, 20).slice(0, 3) })
    },
  })
}

export const useOrgAuditLog = (orgId: string, page = 1, limit = 20, enabled = true) =>
  useQuery({
    queryKey: orgInfraKeys.auditLog(orgId, page, limit),
    enabled: enabled && !!orgId,
    queryFn: () =>
      api
        .get<{ audit_log: OrgAuditEntry[]; pagination: Pagination }>(`/api/organizations/${orgId}/audit-log`, { params: { page, limit } })
        .then((r) => r.data),
  })

export const useOrgSubdomain = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: orgInfraKeys.subdomain(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<OrgSubdomainConfig>(`/api/organizations/${orgId}/subdomain`).then((r) => r.data),
  })

export const useUpdateSubdomain = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (subdomain: string) =>
      api.put<OrgSubdomainConfig>(`/api/organizations/${orgId}/subdomain`, { subdomain }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgInfraKeys.subdomain(orgId) })
    },
  })
}

export const useDeactivateSubdomain = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete<{ status: string }>(`/api/organizations/${orgId}/subdomain`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgInfraKeys.subdomain(orgId) })
    },
  })
}

export const useOrgSsoConfigs = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: orgInfraKeys.ssoConfigs(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ configs: OrgSsoConfig[] }>(`/api/organizations/${orgId}/sso/configs`).then((r) => r.data),
  })

export const useCreateSsoConfig = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<OrgSsoConfig>) =>
      api.post<OrgSsoConfig>(`/api/organizations/${orgId}/sso/configs`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgInfraKeys.ssoConfigs(orgId) })
    },
  })
}

export const useUpdateSsoConfig = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ configId, payload }: { configId: string; payload: Partial<OrgSsoConfig> }) =>
      api.put<OrgSsoConfig>(`/api/organizations/${orgId}/sso/configs/${configId}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgInfraKeys.ssoConfigs(orgId) })
    },
  })
}

export const useVaultSecrets = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: orgInfraKeys.vaultSecrets(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ secrets: OrgVaultSecret[] }>(`/api/organizations/${orgId}/vault/secrets`).then((r) => r.data),
  })

export const useStoreSecret = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      name: string
      value: string
      secret_type?: string
      provider?: string
      key_ref?: string
    }) =>
      api
        .post<{ id: string }>(`/api/organizations/${orgId}/vault/secrets`, {
          name: payload.name,
          secret_type: payload.secret_type ?? 'generic',
          provider: payload.provider ?? 'cloudflare',
          key_ref: payload.key_ref,
          secret_value: payload.value,
          metadata: JSON.stringify({
            provider: payload.provider ?? 'cloudflare',
            key_ref: payload.key_ref ?? null,
            value_present: Boolean(payload.value),
          }),
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgInfraKeys.vaultSecrets(orgId) })
    },
  })
}

export const useRevokeSecret = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (secretId: string) => api.delete<{ deleted: boolean }>(`/api/organizations/${orgId}/vault/secrets/${secretId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgInfraKeys.vaultSecrets(orgId) })
    },
  })
}

export const useRotateSecret = (orgId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name }: { name: string }) =>
      api.post<{ id: string }>(`/api/organizations/${orgId}/vault/secrets/${name}/rotate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgInfraKeys.vaultSecrets(orgId) })
    },
  })
}

export const useTestSecret = (orgId: string) => {
  return useMutation({
    mutationFn: (name: string) => api.post<{ exists?: boolean; is_active?: boolean; message?: string }>(`/api/organizations/${orgId}/vault/secrets/${name}/test`).then((r) => r.data),
  })
}
