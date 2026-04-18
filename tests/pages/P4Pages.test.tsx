import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PodcastsPage from '../../src/pages/PodcastsPage'
import PublicationsPage from '../../src/pages/PublicationsPage'
import MarketingPage from '../../src/pages/MarketingPage'
import LeadsPage from '../../src/pages/LeadsPage'

const useFeatureFlagMock = vi.fn()
const usePodcastsMock = vi.fn()
const usePublicationIssuesMock = vi.fn()
const useAbTestsMock = vi.fn()
const useLeadContactsMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/usePodcasts', () => ({
  usePodcasts: (...args: unknown[]) => usePodcastsMock(...args),
  useCreatePodcast: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../../src/hooks/usePublications', () => ({
  usePublicationIssues: (...args: unknown[]) => usePublicationIssuesMock(...args),
  useCreateIssue: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../../src/hooks/useMarketing', () => ({
  useAbTests: (...args: unknown[]) => useAbTestsMock(...args),
  useCreateAbTest: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../../src/hooks/useLeads', () => ({
  useLeadContacts: (...args: unknown[]) => useLeadContactsMock(...args),
  useCreateLeadContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: () => ({ toast: vi.fn() }),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

describe('P4 pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    usePodcastsMock.mockReturnValue({ isLoading: false, data: { shows: [{ id: 'p-1', title: 'Show' }] } })
    usePublicationIssuesMock.mockReturnValue({ isLoading: false, data: { issues: [{ id: 'i-1', title: 'Issue' }] } })
    useAbTestsMock.mockReturnValue({ isLoading: false, data: { campaigns: [{ id: 'c-1', name: 'A/B #1' }] } })
    useLeadContactsMock.mockReturnValue({ isLoading: false, data: { leads: [{ id: 'l-1', email: 'lead@example.com' }] } })
  })

  it('renders P4 pages when enabled', () => {
    render(<MemoryRouter><PodcastsPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /podcasts/i })).toBeInTheDocument()

    render(<MemoryRouter><PublicationsPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /publications/i })).toBeInTheDocument()

    render(<MemoryRouter><MarketingPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /marketing/i })).toBeInTheDocument()

    render(<MemoryRouter><LeadsPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /leads & crm/i })).toBeInTheDocument()
  })

  it('renders coming soon when a feature is disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })

    render(<MemoryRouter><PodcastsPage /></MemoryRouter>)
    expect(screen.getByText(/podcasts is coming soon/i)).toBeInTheDocument()
  })
})
