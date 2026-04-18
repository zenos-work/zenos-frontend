import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useCreateApiKey,
  useCreateSsoConfig,
  useOrgApiKeys,
  useOrgAuditLog,
  useOrgSsoConfigs,
  useOrgSubdomain,
  useRevokeSecret,
  useRotateSecret,
  useStoreSecret,
  useTestSecret,
  useUpdateSsoConfig,
  useUpdateSubdomain,
  useVaultSecrets,
} from '../../src/hooks/useOrgInfra'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useOrgInfra hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches API keys, audit log, subdomain, and sso configs', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { api_keys: [{ id: 'k1', name: 'Main key', key_prefix: 'abcd', scopes: '["read"]', created_at: '2026-01-01' }], pagination: { page: 1, limit: 20, total: 1, pages: 1 } } } as never)
      .mockResolvedValueOnce({ data: { audit_log: [{ id: 'a1', action: 'api_key.created', created_at: '2026-01-01' }], pagination: { page: 1, limit: 20, total: 1, pages: 1 } } } as never)
      .mockResolvedValueOnce({ data: { org_id: 'org-1', subdomain: 'team-alpha' } } as never)
      .mockResolvedValueOnce({ data: { configs: [{ id: 's1', org_id: 'org-1', provider_type: 'okta', protocol: 'saml' }] } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()

    const keys = renderHook(() => useOrgApiKeys('org-1', true), { wrapper: a.Wrapper })
    const audit = renderHook(() => useOrgAuditLog('org-1', 1, 20, true), { wrapper: b.Wrapper })
    const subdomain = renderHook(() => useOrgSubdomain('org-1', true), { wrapper: c.Wrapper })
    const sso = renderHook(() => useOrgSsoConfigs('org-1', true), { wrapper: d.Wrapper })

    await waitFor(() => {
      expect(keys.result.current.isSuccess).toBe(true)
      expect(audit.result.current.isSuccess).toBe(true)
      expect(subdomain.result.current.isSuccess).toBe(true)
      expect(sso.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/organizations/org-1/api-keys', { params: { page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/organizations/org-1/audit-log', { params: { page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/organizations/org-1/subdomain')
    expect(api.get).toHaveBeenCalledWith('/api/organizations/org-1/sso/configs')
  })

  it('fetches vault secrets', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        secrets: [{ id: 'sec-1', org_id: 'org-1', name: 'SENDGRID_API_KEY', created_at: '2026-01-01' }],
      },
    } as never)

    const wrapper = createQueryClientWrapper()
    const secrets = renderHook(() => useVaultSecrets('org-1', true), { wrapper: wrapper.Wrapper })

    await waitFor(() => {
      expect(secrets.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/organizations/org-1/vault/secrets')
  })

  it('creates api key, updates subdomain, and creates/updates sso config', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'k1', key: 'secret-1', key_prefix: 'abcd', name: 'Main key' } } as never)
      .mockResolvedValueOnce({ data: { id: 's1' } } as never)
    vi.mocked(api.put)
      .mockResolvedValueOnce({ data: { org_id: 'org-1', subdomain: 'team-beta' } } as never)
      .mockResolvedValueOnce({ data: { id: 's1' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()

    const createApiKey = renderHook(() => useCreateApiKey('org-1'), { wrapper: a.Wrapper })
    const updateSubdomain = renderHook(() => useUpdateSubdomain('org-1'), { wrapper: b.Wrapper })
    const createSso = renderHook(() => useCreateSsoConfig('org-1'), { wrapper: c.Wrapper })
    const updateSso = renderHook(() => useUpdateSsoConfig('org-1'), { wrapper: d.Wrapper })

    await act(async () => {
      await createApiKey.result.current.mutateAsync({ name: 'Main key', scopes: ['read', 'write'] })
      await updateSubdomain.result.current.mutateAsync('team-beta')
      await createSso.result.current.mutateAsync({ provider_type: 'okta', protocol: 'saml' })
      await updateSso.result.current.mutateAsync({ configId: 's1', payload: { provider_type: 'okta', protocol: 'oidc' } })
    })

    expect(api.post).toHaveBeenCalledWith('/api/organizations/org-1/api-keys', { name: 'Main key', scopes: '["read","write"]' })
    expect(api.put).toHaveBeenCalledWith('/api/organizations/org-1/subdomain', { subdomain: 'team-beta' })
    expect(api.post).toHaveBeenCalledWith('/api/organizations/org-1/sso/configs', { provider_type: 'okta', protocol: 'saml' })
    expect(api.put).toHaveBeenCalledWith('/api/organizations/org-1/sso/configs/s1', { provider_type: 'okta', protocol: 'oidc' })
  })

  it('stores, rotates, tests, and revokes vault secrets', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'sec-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'sec-1' } } as never)
      .mockResolvedValueOnce({ data: { ok: true } } as never)
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { deleted: true } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()

    const storeSecret = renderHook(() => useStoreSecret('org-1'), { wrapper: a.Wrapper })
    const rotateSecret = renderHook(() => useRotateSecret('org-1'), { wrapper: b.Wrapper })
    const testSecret = renderHook(() => useTestSecret('org-1'), { wrapper: c.Wrapper })
    const revokeSecret = renderHook(() => useRevokeSecret('org-1'), { wrapper: d.Wrapper })

    await act(async () => {
      await storeSecret.result.current.mutateAsync({ name: 'SENDGRID_API_KEY', value: 'secret' })
      await rotateSecret.result.current.mutateAsync({ name: 'SENDGRID_API_KEY' })
      await testSecret.result.current.mutateAsync('SENDGRID_API_KEY')
      await revokeSecret.result.current.mutateAsync('sec-1')
    })

    expect(api.post).toHaveBeenCalledWith('/api/organizations/org-1/vault/secrets', {
      name: 'SENDGRID_API_KEY',
      secret_type: 'generic',
      provider: 'cloudflare',
      key_ref: undefined,
      secret_value: 'secret',
      metadata: JSON.stringify({ provider: 'cloudflare', key_ref: null, value_present: true }),
    })
    expect(api.post).toHaveBeenCalledWith('/api/organizations/org-1/vault/secrets/SENDGRID_API_KEY/rotate')
    expect(api.post).toHaveBeenCalledWith('/api/organizations/org-1/vault/secrets/SENDGRID_API_KEY/test')
    expect(api.delete).toHaveBeenCalledWith('/api/organizations/org-1/vault/secrets/sec-1')
  })
})
