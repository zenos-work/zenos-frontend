import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EarningsPage from '../../src/pages/EarningsPage'

const useFeatureFlagMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/useEarnings', () => ({
  useMyEarnings: () => ({ data: { totals: { earned_cents: 12345 } } }),
  useMyPayouts: () => ({ data: { items: [{ id: 'p1' }] } }),
  useEarningsBreakdown: () => ({ data: { status: 'ready' }, isLoading: false }),
  useReceivedTips: () => ({ data: { items: [{ id: 't1' }, { id: 't2' }] } }),
  useRequestPayout: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: 'payout-1' }) }),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: (...args: unknown[]) => void }) => unknown) => selector({ toast: vi.fn() }),
}))

describe('EarningsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders coming soon when feature flag is disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })

    render(
      <MemoryRouter>
        <EarningsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/earnings dashboard is coming soon/i)).toBeInTheDocument()
  })

  it('renders earnings metrics when feature flag is enabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })

    render(
      <MemoryRouter>
        <EarningsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /earnings/i })).toBeInTheDocument()
    expect(screen.getByText('$123.45')).toBeInTheDocument()
  })
})
