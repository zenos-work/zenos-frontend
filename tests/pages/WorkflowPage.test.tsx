import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowPage from '../../src/pages/WorkflowPage'
import { createQueryClientWrapper } from '../utils/queryClient'
import { makeArticleDetail, makePaginatedResponse } from '../utils/fixtures'
import api from '../../src/lib/api'

const useAuthMock = vi.fn()
const useApprovalQueueMock = vi.fn()
const useNotificationsMock = vi.fn()
const useApproveArticleMock = vi.fn()
const usePublishArticleMock = vi.fn()
const useRejectArticleMock = vi.fn()
const useMyArticlesMock = vi.fn()
const useUiStoreMock = vi.fn()
const useFeatureFlagMock = vi.fn()
const toastMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/hooks/useAdmin', () => ({
  useApprovalQueue: (...args: unknown[]) => useApprovalQueueMock(...args),
  useNotifications: (...args: unknown[]) => useNotificationsMock(...args),
  useApproveArticle: () => useApproveArticleMock(),
  usePublishArticle: () => usePublishArticleMock(),
  useRejectArticle: () => useRejectArticleMock(),
}))

vi.mock('../../src/hooks/useArticles', () => ({
  useMyArticles: (...args: unknown[]) => useMyArticlesMock(...args),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: (...args: unknown[]) => void }) => unknown) =>
    selector({ toast: useUiStoreMock() }),
}))

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/components/workflow/WorkflowBuilder', () => ({
  default: () => <div>WorkflowBuilder</div>,
}))

vi.mock('../../src/components/workflow/WorkflowTemplateGallery', () => ({
  default: () => <div>WorkflowTemplateGallery</div>,
}))

vi.mock('../../src/components/workflow/WorkflowTaskInbox', () => ({
  default: () => <div>WorkflowTaskInbox</div>,
}))

vi.mock('../../src/lib/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

describe('WorkflowPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUiStoreMock.mockReturnValue(toastMock)
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })
    useApproveArticleMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false })
    usePublishArticleMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false })
    useRejectArticleMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false })

    useApprovalQueueMock.mockReturnValue({
      data: {
        queue: [
          makeArticleDetail({
            id: 'a-1',
            title: 'Editorial Roadmap',
            status: 'SUBMITTED',
            author_id: 'u-1',
            author_name: 'Alex Writer',
          }),
        ],
      },
      isLoading: false,
      isError: false,
    })

    useMyArticlesMock.mockReturnValue({
      data: makePaginatedResponse([]),
      isLoading: false,
      isError: false,
    })

    useNotificationsMock.mockReturnValue({
      data: {
        notifications: [
          {
            id: 'n-1',
            type: 'COMMENT',
            message: 'Approval chat: Please prioritize this review.',
            is_read: 0,
            article_id: 'a-1',
            created_at: '2026-03-30T10:00:00Z',
          },
        ],
      },
      isLoading: false,
      isError: false,
    })
  })

  it('renders reviewer workflow view with steps, actions, and messages', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u-reviewer', role: 'APPROVER' } })

    const { Wrapper } = createQueryClientWrapper()
    render(
      <MemoryRouter>
        <WorkflowPage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    expect(screen.getByText('Workflow')).toBeInTheDocument()
    expect(screen.getAllByText('Editorial Roadmap').length).toBeGreaterThan(0)
    expect(screen.getByText('Workflow progress')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
    expect(screen.getByText(/Approval chat:/i)).toBeInTheDocument()
  })

  it('sends workflow message to approvers for selected article', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'u-reviewer', role: 'APPROVER' } })

    const { Wrapper } = createQueryClientWrapper()
    render(
      <MemoryRouter>
        <WorkflowPage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    fireEvent.change(screen.getByPlaceholderText(/message approvers/i), {
      target: { value: 'Escalating for same-day publish.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/users/approvers/message', {
        article_id: 'a-1',
        mode: 'group',
        message: 'Escalating for same-day publish.',
      })
      expect(toastMock).toHaveBeenCalledWith('Workflow message sent to approvers', 'success')
    })
  })

  it('renders workflow builder tabs when feature flag is enabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useAuthMock.mockReturnValue({ user: { id: 'u-reviewer', role: 'APPROVER' } })

    const { Wrapper } = createQueryClientWrapper()
    render(
      <MemoryRouter>
        <WorkflowPage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    fireEvent.click(screen.getByRole('button', { name: /my workflows/i }))
    expect(screen.getByText('WorkflowBuilder')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /templates/i }))
    expect(screen.getByText('WorkflowTemplateGallery')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /task inbox/i }))
    expect(screen.getByText('WorkflowTaskInbox')).toBeInTheDocument()
  })
})
