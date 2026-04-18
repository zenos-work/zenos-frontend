import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OrgPage from '../../src/pages/OrgPage'

const useFeatureFlagMock = vi.fn()
const useOrgMock = vi.fn()
const useOrgMembersMock = vi.fn()
const useOrgTeamsMock = vi.fn()
const useOrgInvitationsMock = vi.fn()
const useAddMemberMock = vi.fn()
const useCreateTeamMock = vi.fn()
const useSendInvitationMock = vi.fn()
const useRevokeInvitationMock = vi.fn()
const toastMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/useOrg', () => ({
  useOrg: (...args: unknown[]) => useOrgMock(...args),
  useOrgMembers: (...args: unknown[]) => useOrgMembersMock(...args),
  useOrgTeams: (...args: unknown[]) => useOrgTeamsMock(...args),
  useOrgInvitations: (...args: unknown[]) => useOrgInvitationsMock(...args),
  useAddMember: (...args: unknown[]) => useAddMemberMock(...args),
  useCreateTeam: (...args: unknown[]) => useCreateTeamMock(...args),
  useSendInvitation: (...args: unknown[]) => useSendInvitationMock(...args),
  useRevokeInvitation: (...args: unknown[]) => useRevokeInvitationMock(...args),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: typeof toastMock }) => unknown) => selector({ toast: toastMock }),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

describe('OrgPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useOrgMock.mockReturnValue({
      isLoading: false,
      data: { id: 'org-1', name: 'Team Alpha', description: 'Org description' },
    })
    useOrgMembersMock.mockReturnValue({
      data: {
        members: [{ id: 'm1', user_id: 'u1', org_role: 'owner', joined_at: '2026-01-01' }],
        pagination: { total: 1 },
      },
    })
    useOrgTeamsMock.mockReturnValue({
      data: {
        teams: [{ id: 't1', name: 'Editorial', created_at: '2026-01-01', updated_at: '2026-01-01' }],
        pagination: { total: 1 },
      },
    })
    useOrgInvitationsMock.mockReturnValue({
      data: {
        invitations: [{ id: 'inv-1', email: 'person@org.com', org_role: 'member', status: 'pending' }],
        pagination: { total: 1 },
      },
    })
    useAddMemberMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ id: 'm2' }), isPending: false })
    useCreateTeamMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ id: 't2' }), isPending: false })
    useSendInvitationMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ id: 'inv-2' }), isPending: false })
    useRevokeInvitationMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ status: 'deleted' }), isPending: false })
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('renders feature fallback when organizations flag is disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })

    render(
      <MemoryRouter initialEntries={['/org/org-1']}>
        <Routes>
          <Route path='/org/:id' element={<OrgPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/organizations is coming soon/i)).toBeInTheDocument()
  })

  it('renders organization dashboard and supports member add flow', async () => {
    const addMemberMutate = vi.fn().mockResolvedValue({ id: 'm2' })
    useAddMemberMock.mockReturnValue({ mutateAsync: addMemberMutate, isPending: false })

    render(
      <MemoryRouter initialEntries={['/org/org-1']}>
        <Routes>
          <Route path='/org/:id' element={<OrgPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Team Alpha' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /members/i }))
    fireEvent.change(screen.getByPlaceholderText('User ID'), { target: { value: 'u2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(addMemberMutate).toHaveBeenCalledWith({ user_id: 'u2', role: 'member' })
    })
    expect(toastMock).toHaveBeenCalledWith('Member added', 'success')
  })
})
