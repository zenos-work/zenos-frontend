import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminPage from '../../src/pages/AdminPage'
import { createQueryClientWrapper } from '../utils/queryClient'
import { makeArticleDetail } from '../utils/fixtures'
import api from '../../src/lib/api'

const useAuthMock = vi.fn()
const useAdminStatsMock = vi.fn()
const useAdminSuccessSignalsMock = vi.fn()
const useAdminSuccessSignalHistoryMock = vi.fn()
const useApprovalQueueMock = vi.fn()
const useAdminUsersMock = vi.fn()
const useUiStoreMock = vi.fn()
const toastMock = vi.fn()
const banMutateAsyncMock = vi.fn()
const unbanMutateAsyncMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/hooks/useAdmin', () => ({
  useAdminStats: (...args: unknown[]) => useAdminStatsMock(...args),
  useAdminSuccessSignals: (...args: unknown[]) => useAdminSuccessSignalsMock(...args),
  useAdminSuccessSignalHistory: (...args: unknown[]) => useAdminSuccessSignalHistoryMock(...args),
  useApprovalQueue: (...args: unknown[]) => useApprovalQueueMock(...args),
  useAdminUsers: (...args: unknown[]) => useAdminUsersMock(...args),
  useBanUser: () => ({ mutateAsync: banMutateAsyncMock }),
  useUnbanUser: () => ({ mutateAsync: unbanMutateAsyncMock }),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: (...args: unknown[]) => void }) => unknown) =>
    selector({ toast: useUiStoreMock() }),
}))

vi.mock('../../src/lib/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUiStoreMock.mockReturnValue(toastMock)
    banMutateAsyncMock.mockResolvedValue({})
    unbanMutateAsyncMock.mockResolvedValue({})
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never)
    vi.stubGlobal('confirm', vi.fn(() => true))

    useAdminStatsMock.mockReturnValue({
      data: {
        total_users: 10,
        total_comments: 25,
        articles_by_status: [{ status: 'PUBLISHED', c: 3 }],
        top_articles: [makeArticleDetail({ id: 'a-top', title: 'Top Story' })],
        governance: {
          users_by_role: [{ role: 'AUTHOR', c: 5 }],
          moderation: { pending_approvals: 1, flagged_comments: 2, hidden_comments: 1 },
          recent_activity: { notifications_7d: 4, published_7d: 3, approved_7d: 2, rejected_7d: 1 },
        },
      },
      isLoading: false,
      isError: false,
    })

    useAdminSuccessSignalsMock.mockReturnValue({
      data: {
        snapshots: [
          {
            article_id: 'a-top',
            slug: 'top-story',
            title: 'Top Story',
            bucket_hour: '2026-03-24 12:00:00',
            views_count: 100,
            likes_count: 12,
            comments_count: 4,
            outcome_events_count: 1,
            outcome_tag_count: 2,
            engagement_score: 252,
            success_rate: 84,
            updated_at: '2026-03-24 12:05:00',
          },
        ],
        pagination: { page: 1, pages: 1, total: 1, limit: 10, has_more: false },
      },
      isLoading: false,
      isError: false,
    })

    useAdminSuccessSignalHistoryMock.mockReturnValue({
      data: {
        article_id: 'a-top',
        hours: 12,
        points: [
          { bucket_hour: '2026-03-24 10:00:00', success_rate: 40, engagement_score: 80 },
          { bucket_hour: '2026-03-24 11:00:00', success_rate: 60, engagement_score: 120 },
          { bucket_hour: '2026-03-24 12:00:00', success_rate: 84, engagement_score: 252 },
        ],
      },
      isLoading: false,
      isError: false,
    })

    useApprovalQueueMock.mockReturnValue({
      data: {
        queue: [makeArticleDetail({ id: 'a-1', title: 'Pending Story', status: 'SUBMITTED' })],
        pagination: { page: 1, pages: 1, total: 1, limit: 20, has_more: false },
      },
      isLoading: false,
      isError: false,
    })

    useAdminUsersMock.mockReturnValue({
      data: {
        users: [
          {
            id: 'u-active',
            name: 'Active User',
            email: 'active@zenos.work',
            role: 'AUTHOR',
            is_active: 1,
            created_at: '2026-01-01T00:00:00Z',
          },
          {
            id: 'u-banned',
            name: 'Banned User',
            email: 'banned@zenos.work',
            role: 'READER',
            is_active: 0,
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        pagination: { page: 1, pages: 1, total: 2, limit: 20, has_more: false },
      },
      isLoading: false,
      isError: false,
    })
  })

  it('shows queue-only approver view for non-superadmin users', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'APPROVER' } })

    const { Wrapper } = createQueryClientWrapper()
    render(<AdminPage />, { wrapper: Wrapper })

    expect(screen.getByText('Approver view')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /queue/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /stats/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /users/i })).not.toBeInTheDocument()
    expect(screen.getByText('Pending Story')).toBeInTheDocument()
  })

  it('shows superadmin tabs and stats content', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'SUPERADMIN' } })

    const { Wrapper } = createQueryClientWrapper()
    render(<AdminPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /stats/i }))

    expect(screen.getByText('Active users')).toBeInTheDocument()
    expect(screen.getAllByText('Users by role').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Top Story').length).toBeGreaterThan(0)
    expect(screen.getByText('Success signals (SR-011)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /users/i })).toBeInTheDocument()
  })

  it('opens reject modal and enables rejection only with a note', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'SUPERADMIN' } })

    const { Wrapper } = createQueryClientWrapper()
    render(<AdminPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }))

    expect(screen.getByText('Reject article')).toBeInTheDocument()

    const rejectButton = screen.getAllByRole('button', { name: /^reject$/i })[1]
    expect(rejectButton).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText(/reason for rejection/i), {
      target: { value: 'Please improve factual accuracy.' },
    })

    expect(rejectButton).toBeEnabled()

    fireEvent.click(rejectButton)

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Rejected: Pending Story', 'success')
    })
  })

  it('shows queue empty state when there are no pending items', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'APPROVER' } })
    useApprovalQueueMock.mockReturnValue({
      data: {
        queue: [],
        pagination: { page: 1, pages: 1, total: 0, limit: 20, has_more: false },
      },
      isLoading: false,
      isError: false,
    })

    const { Wrapper } = createQueryClientWrapper()
    render(<AdminPage />, { wrapper: Wrapper })

    expect(screen.getByText('Queue is empty — nothing to review.')).toBeInTheDocument()
  })

  it('shows queue error panel when queue request fails', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'APPROVER' } })
    useApprovalQueueMock.mockReturnValue({ data: undefined, isLoading: false, isError: true })

    const { Wrapper } = createQueryClientWrapper()
    render(<AdminPage />, { wrapper: Wrapper })

    expect(screen.getByText('Failed to load approval queue.')).toBeInTheDocument()
  })

  it('shows stats error panel for superadmin when stats request fails', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'SUPERADMIN' } })
    useAdminStatsMock.mockReturnValue({ data: undefined, isLoading: false, isError: true })

    const { Wrapper } = createQueryClientWrapper()
    render(<AdminPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /stats/i }))
    expect(screen.getByText('Failed to load admin stats.')).toBeInTheDocument()
  })

  it('shows error toast when approve action fails', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'SUPERADMIN' } })
    vi.mocked(api.post).mockRejectedValueOnce(new Error('approve failed'))

    const { Wrapper } = createQueryClientWrapper()
    render(<AdminPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /approve/i }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Failed to approve article', 'error')
    })
  })

  it('handles users tab ban/unban actions for superadmin', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'SUPERADMIN' } })

    const { Wrapper } = createQueryClientWrapper()
    render(<AdminPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /users/i }))

    fireEvent.click(screen.getByRole('button', { name: 'Ban' }))
    await waitFor(() => {
      expect(banMutateAsyncMock).toHaveBeenCalledWith('u-active')
    })
    expect(toastMock).toHaveBeenCalledWith('Active User banned', 'success')

    fireEvent.click(screen.getByRole('button', { name: 'Unban' }))
    await waitFor(() => {
      expect(unbanMutateAsyncMock).toHaveBeenCalledWith('u-banned')
    })
    expect(toastMock).toHaveBeenCalledWith('Banned User unbanned', 'success')
  })

  it('skips ban when confirmation is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'SUPERADMIN' } })

    const { Wrapper } = createQueryClientWrapper()
    render(<AdminPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /users/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Ban' }))

    await waitFor(() => {
      expect(banMutateAsyncMock).not.toHaveBeenCalled()
    })
  })

  it('allows superadmin to edit a user and assign a new role', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'SUPERADMIN' } })

    const { Wrapper } = createQueryClientWrapper()
    render(<AdminPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /users/i }))

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: 'APPROVER' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save role/i }))

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/api/users/u-active/role', {
        role: 'APPROVER',
      })
    })
    expect(toastMock).toHaveBeenCalledWith('Updated role for Active User to APPROVER', 'success')
  })
})
