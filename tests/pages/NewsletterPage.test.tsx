import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NewsletterPage from '../../src/pages/NewsletterPage'

const useFeatureFlagMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/useOrg', () => ({
  useMyOrgs: () => ({ data: { organizations: [{ id: 'org-1' }] } }),
}))

vi.mock('../../src/hooks/useNewsletters', () => ({
  useMyNewsletters: () => ({ isLoading: false, data: { newsletters: [{ id: 'n1', name: 'Weekly Brief', slug: 'weekly-brief' }] } }),
  useCreateNewsletter: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: 'n2' }) }),
  useDeleteNewsletter: () => ({ mutateAsync: vi.fn().mockResolvedValue({ deleted: true }) }),
  useNewsletterSubscribers: () => ({ data: { subscribers: [{ id: 's1', email: 'reader@zenos.work', status: 'subscribed' }] } }),
  useNewsletterIssues: () => ({ data: { issues: [{ id: 'i1', subject: 'Issue one', status: 'draft' }] } }),
  useAddSubscriber: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: 's2' }) }),
  useUpdateSubscriberStatus: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: 's1' }) }),
  useCreateIssue: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: 'i2' }) }),
  useDeleteIssue: () => ({ mutateAsync: vi.fn().mockResolvedValue({ deleted: true }) }),
  useSendIssue: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: 'i1' }) }),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: (...args: unknown[]) => void }) => unknown) => selector({ toast: vi.fn() }),
}))

describe('NewsletterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders coming soon state when newsletters flag is disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })

    render(
      <MemoryRouter>
        <NewsletterPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/newsletters is coming soon/i)).toBeInTheDocument()
  })

  it('renders newsletter management sections when feature is enabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })

    render(
      <MemoryRouter>
        <NewsletterPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /newsletter management/i })).toBeInTheDocument()
    expect(screen.getByText('Weekly Brief')).toBeInTheDocument()
    expect(screen.getByText('reader@zenos.work')).toBeInTheDocument()
    expect(screen.getByText('Issue one')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Issue subject'), { target: { value: 'New issue' } })
    expect(screen.getByDisplayValue('New issue')).toBeInTheDocument()
  })
})
