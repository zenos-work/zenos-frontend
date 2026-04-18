import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MarketplaceItemPage from '../../src/pages/MarketplaceItemPage'

const useFeatureFlagMock = vi.fn()
const useMarketplaceItemMock = vi.fn()
const useItemReviewsMock = vi.fn()
const usePurchaseItemMock = vi.fn()
const useWriteReviewMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/useMarketplace', () => ({
  useMarketplaceItem: (...args: unknown[]) => useMarketplaceItemMock(...args),
  useItemReviews: (...args: unknown[]) => useItemReviewsMock(...args),
  usePurchaseItem: (...args: unknown[]) => usePurchaseItemMock(...args),
  useWriteReview: (...args: unknown[]) => useWriteReviewMock(...args),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (s: { toast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ toast: vi.fn() }),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

const mockPurchase = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }
const mockWriteReview = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }

function renderPage(itemId = 'item-1') {
  return render(
    <MemoryRouter initialEntries={[`/marketplace/${itemId}`]}>
      <Routes>
        <Route path='/marketplace/:id' element={<MarketplaceItemPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MarketplaceItemPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePurchaseItemMock.mockReturnValue(mockPurchase)
    useWriteReviewMock.mockReturnValue(mockWriteReview)
    useItemReviewsMock.mockReturnValue({ data: { reviews: [] } })
  })

  it('renders coming soon when flag disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })
    useMarketplaceItemMock.mockReturnValue({ isLoading: false, data: null })
    renderPage()
    expect(screen.getByText(/marketplace item is coming soon/i)).toBeInTheDocument()
  })

  it('renders loading spinner while item loads', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useMarketplaceItemMock.mockReturnValue({ isLoading: true, data: null })
    renderPage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders item name and formatted price', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useMarketplaceItemMock.mockReturnValue({
      isLoading: false,
      data: { id: 'item-1', name: 'Analytics Pro', price_cents: 4999, currency: 'USD', short_desc: 'A great tool' },
    })
    renderPage()
    expect(screen.getByText('Analytics Pro')).toBeInTheDocument()
    expect(screen.getByText('$49.99')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buy now/i })).toBeInTheDocument()
  })

  it('renders Free label and get for free button for free items', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useMarketplaceItemMock.mockReturnValue({
      isLoading: false,
      data: { id: 'item-2', name: 'Starter Kit', price_cents: 0, currency: 'USD', short_desc: '' },
    })
    renderPage()
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get for free/i })).toBeInTheDocument()
  })

  it('renders review stars when reviews exist', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useMarketplaceItemMock.mockReturnValue({
      isLoading: false,
      data: { id: 'item-1', name: 'Tool', price_cents: 500, currency: 'USD', short_desc: '' },
    })
    useItemReviewsMock.mockReturnValue({
      data: {
        reviews: [
          { id: 'r-1', rating: 5, body: 'Excellent', item_id: 'item-1', reviewer_id: 'u-1' },
          { id: 'r-2', rating: 3, body: 'OK', item_id: 'item-1', reviewer_id: 'u-2' },
        ],
      },
    })
    renderPage()
    expect(screen.getByText(/2 reviews/i)).toBeInTheDocument()
    // stars rendered
    expect(screen.getAllByLabelText(/out of 5 stars/i).length).toBeGreaterThan(0)
  })

  it('renders review list', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useMarketplaceItemMock.mockReturnValue({
      isLoading: false,
      data: { id: 'item-1', name: 'Tool', price_cents: 0, currency: 'USD', short_desc: '' },
    })
    useItemReviewsMock.mockReturnValue({
      data: { reviews: [{ id: 'r-1', rating: 4, body: 'Great tool!', item_id: 'item-1', reviewer_id: 'u-1' }] },
    })
    renderPage()
    expect(screen.getByText('Great tool!')).toBeInTheDocument()
  })
})
