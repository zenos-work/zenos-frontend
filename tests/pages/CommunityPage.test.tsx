import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import CommunityPage from '../../src/pages/CommunityPage'

const useFeatureFlagMock = vi.fn()
const useCommunitySpacesMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/useCommunity', () => ({
  useCommunitySpaces: (...args: unknown[]) => useCommunitySpacesMock(...args),
  useCreateSpace: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('../../src/hooks/useOrg', () => ({
  useMyOrgs: () => ({ data: { organizations: [{ id: 'org-1' }] } }),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: () => vi.fn(),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

describe('CommunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders coming soon when flag is disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })
    useCommunitySpacesMock.mockReturnValue({ isLoading: false, data: { spaces: [] } })

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/community spaces is coming soon/i)).toBeInTheDocument()
  })

  it('renders spaces list when enabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useCommunitySpacesMock.mockReturnValue({ isLoading: false, data: { spaces: [{ id: 's-1', name: 'AI Writers' }] } })

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /community spaces/i })).toBeInTheDocument()
    expect(screen.getByText('AI Writers')).toBeInTheDocument()
  })
})
