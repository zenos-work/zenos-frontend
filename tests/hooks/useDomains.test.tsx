import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import { useAddDomain, useDeleteDomain, useMyDomains, useVerifyDomain } from '../../src/hooks/useDomains'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useDomains hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches custom domains list', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        domains: [{ id: 'd1', domain: 'example.com', resource_type: 'blog', verification_status: 'pending', verification_method: 'cname', verification_token: 'token', ssl_status: 'pending', is_active: false, created_at: '2026-01-01', updated_at: '2026-01-01' }],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      },
    } as never)

    const wrapper = createQueryClientWrapper()
    const result = renderHook(() => useMyDomains(true), { wrapper: wrapper.Wrapper })

    await waitFor(() => {
      expect(result.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/domains', { params: { page: 1, limit: 20 } })
  })

  it('adds, verifies, and deletes domain', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'd1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'd1', verification_status: 'verified' } } as never)
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { status: 'deleted' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()

    const add = renderHook(() => useAddDomain(), { wrapper: a.Wrapper })
    const verify = renderHook(() => useVerifyDomain(), { wrapper: b.Wrapper })
    const remove = renderHook(() => useDeleteDomain(), { wrapper: c.Wrapper })

    await act(async () => {
      await add.result.current.mutateAsync({ domain: 'example.com' })
      await verify.result.current.mutateAsync('d1')
      await remove.result.current.mutateAsync('d1')
    })

    expect(api.post).toHaveBeenCalledWith('/api/domains', {
      domain: 'example.com',
      resource_type: 'blog',
      verification_method: 'cname',
      org_id: undefined,
      resource_id: undefined,
    })
    expect(api.post).toHaveBeenCalledWith('/api/domains/d1/verify')
    expect(api.delete).toHaveBeenCalledWith('/api/domains/d1')
  })
})
