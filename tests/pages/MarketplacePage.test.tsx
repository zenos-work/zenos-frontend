import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MarketplacePage from '../../src/pages/MarketplacePage'

const useFeatureFlagMock = vi.fn()
const useMarketplaceItemsMock = vi.fn()
const useAuthMock = vi.fn()
const useCreateMarketplaceItemMock = vi.fn()
const usePublishItemMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/useMarketplace', () => ({
  useMarketplaceItems: (...args: unknown[]) => useMarketplaceItemsMock(...args),
  useCreateMarketplaceItem: () => useCreateMarketplaceItemMock(),
  usePublishItem: () => usePublishItemMock(),
}))

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (s: { toast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ toast: vi.fn() }),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

const defaultAuth = { user: null }
const defaultCreate = { isPending: false, mutateAsync: vi.fn() }
const defaultPublish = { isPending: false, mutateAsync: vi.fn() }

describe('MarketplacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue(defaultAuth)
    useCreateMarketplaceItemMock.mockReturnValue(defaultCreate)
    usePublishItemMock.mockReturnValue(defaultPublish)
  })

  it('renders coming soon when flag is disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })
    useMarketplaceItemsMock.mockReturnValue({ isLoading: false, data: { items: [] } })

    render(
      <MemoryRouter>
        <MarketplacePage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/marketplace is coming soon/i)).toBeInTheDocument()
  })

  it('renders loading spinner', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useMarketplaceItemsMock.mockReturnValue({ isLoading: true })

    render(<MemoryRouter><MarketplacePage /></MemoryRouter>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders marketplace items with price when enabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useMarketplaceItemsMock.mockReturnValue({
      isLoading: false,
      data: { items: [{ id: 'i-1', name: 'Growth Kit', price_cents: 999, currency: 'USD', seller_id: 'other-user' }] },
    })

    render(<MemoryRouter><MarketplacePage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /marketplace/i })).toBeInTheDocument()
    expect(screen.getByText('Growth Kit')).toBeInTheDocument()
    expect(screen.getByText('$9.99')).toBeInTheDocument()
  })

  it('shows Free label for items with no price', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useMarketplaceItemsMock.mockReturnValue({
      isLoading: false,
      data: { items: [{ id: 'i-2', name: 'Free Tool', price_cents: 0, seller_id: 'other-user' }] },
    })

    render(<MemoryRouter><MarketplacePage /></MemoryRouter>)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('shows seller tab for authenticated users', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useMarketplaceItemsMock.mockReturnValue({ isLoading: false, data: { items: [] } })
    useAuthMock.mockReturnValue({ user: { sub: 'user-1' } })

    render(<MemoryRouter><MarketplacePage /></MemoryRouter>)

    expect(screen.getByRole('button', { name: /my listings/i })).toBeInTheDocument()
  })

  it('switches to seller tab on click', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useMarketplaceItemsMock.mockReturnValue({ isLoading: false, data: { items: [] } })
    useAuthMock.mockReturnValue({ user: { sub: 'user-1' } })

    render(<MemoryRouter><MarketplacePage /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /my listings/i }))
    expect(screen.getByText('Create New Listing')).toBeInTheDocument()
  })
})
