import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useAddMember,
  useCreateOrg,
  useCreateTeam,
  useMyOrgs,
  useOrgInvitations,
  useOrgMembers,
  useOrgTeams,
  useRevokeInvitation,
  useSendInvitation,
} from '../../src/hooks/useOrg'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useOrg hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches org dashboard collections', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { organizations: [{ id: 'org-1', name: 'Team Alpha', slug: 'team-alpha' }], pagination: { page: 1, limit: 20, total: 1, pages: 1 } } } as never)
      .mockResolvedValueOnce({ data: { members: [{ id: 'm1', org_id: 'org-1', user_id: 'u1', org_role: 'owner', joined_at: '2026-01-01' }], pagination: { page: 1, limit: 20, total: 1, pages: 1 } } } as never)
      .mockResolvedValueOnce({ data: { teams: [{ id: 't1', org_id: 'org-1', name: 'Editorial', created_at: '2026-01-01', updated_at: '2026-01-01' }], pagination: { page: 1, limit: 20, total: 1, pages: 1 } } } as never)
      .mockResolvedValueOnce({ data: { invitations: [{ id: 'inv-1', org_id: 'org-1', email: 'person@org.com', org_role: 'member', status: 'pending', expires_at: '2099-12-31', created_at: '2026-01-01' }], pagination: { page: 1, limit: 20, total: 1, pages: 1 } } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()

    const myOrgs = renderHook(() => useMyOrgs(true), { wrapper: a.Wrapper })
    const members = renderHook(() => useOrgMembers('org-1', true), { wrapper: b.Wrapper })
    const teams = renderHook(() => useOrgTeams('org-1', true), { wrapper: c.Wrapper })
    const invitations = renderHook(() => useOrgInvitations('org-1', true), { wrapper: d.Wrapper })

    await waitFor(() => {
      expect(myOrgs.result.current.isSuccess).toBe(true)
      expect(members.result.current.isSuccess).toBe(true)
      expect(teams.result.current.isSuccess).toBe(true)
      expect(invitations.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/organizations', { params: { page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/organizations/org-1/members', { params: { page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/organizations/org-1/teams', { params: { page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/organizations/org-1/invitations', { params: { page: 1, limit: 20 } })
  })

  it('runs create and management mutations', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'org-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'member-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'team-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'inv-1', token: 'tok-1' } } as never)
    vi.mocked(api.delete).mockResolvedValue({ data: { status: 'ok' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()
    const e = createQueryClientWrapper()

    const createOrg = renderHook(() => useCreateOrg(), { wrapper: a.Wrapper })
    const addMember = renderHook(() => useAddMember('org-1'), { wrapper: b.Wrapper })
    const createTeam = renderHook(() => useCreateTeam('org-1'), { wrapper: c.Wrapper })
    const sendInvitation = renderHook(() => useSendInvitation('org-1'), { wrapper: d.Wrapper })
    const revokeInvitation = renderHook(() => useRevokeInvitation('org-1'), { wrapper: e.Wrapper })

    await act(async () => {
      await createOrg.result.current.mutateAsync({ name: 'Team Alpha' })
      await addMember.result.current.mutateAsync({ user_id: 'u2', role: 'member' })
      await createTeam.result.current.mutateAsync({ name: 'Editorial' })
      await sendInvitation.result.current.mutateAsync({ email: 'person@org.com', role: 'viewer' })
      await revokeInvitation.result.current.mutateAsync('inv-1')
    })

    expect(api.post).toHaveBeenCalledWith('/api/organizations', { name: 'Team Alpha' })
    expect(api.post).toHaveBeenCalledWith('/api/organizations/org-1/members', { user_id: 'u2', role: 'member' })
    expect(api.post).toHaveBeenCalledWith('/api/organizations/org-1/teams', { name: 'Editorial' })
    expect(api.post).toHaveBeenCalledWith('/api/organizations/org-1/invitations', { email: 'person@org.com', role: 'viewer' })
    expect(api.delete).toHaveBeenCalledWith('/api/organizations/org-1/invitations/inv-1')
  })
})
