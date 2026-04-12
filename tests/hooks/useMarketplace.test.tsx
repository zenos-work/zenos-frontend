import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useItemReviews,
  useMarketplaceItem,
  useMarketplaceItems,
  usePurchaseItem,
  useWriteReview,
} from '../../src/hooks/useMarketplace'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useMarketplace hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches item list, item detail, and reviews', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { items: [{ id: 'i-1', name: 'Flow Kit' }], page: 1, limit: 20 } } as never)
      .mockResolvedValueOnce({ data: { id: 'i-1', name: 'Flow Kit' } } as never)
      .mockResolvedValueOnce({ data: { reviews: [{ id: 'r-1', rating: 5 }], page: 1, limit: 20 } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()

    const items = renderHook(() => useMarketplaceItems(true), { wrapper: a.Wrapper })
    const item = renderHook(() => useMarketplaceItem('i-1', true), { wrapper: b.Wrapper })
    const reviews = renderHook(() => useItemReviews('i-1', true), { wrapper: c.Wrapper })

    await waitFor(() => {
      expect(items.result.current.isSuccess).toBe(true)
      expect(item.result.current.isSuccess).toBe(true)
      expect(reviews.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/marketplace', { params: { page: 1, limit: 20, category: undefined } })
    expect(api.get).toHaveBeenCalledWith('/api/marketplace/i-1')
    expect(api.get).toHaveBeenCalledWith('/api/marketplace/i-1/reviews', { params: { page: 1, limit: 20 } })
  })

  it('purchases and reviews an item', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'p-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'r-1' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()

    const purchase = renderHook(() => usePurchaseItem('i-1'), { wrapper: a.Wrapper })
    const review = renderHook(() => useWriteReview('i-1'), { wrapper: b.Wrapper })

    await act(async () => {
      await purchase.result.current.mutateAsync({ price_paid_cents: 1000 })
      await review.result.current.mutateAsync({ rating: 5, body: 'Excellent' })
    })

    expect(api.post).toHaveBeenCalledWith('/api/marketplace/i-1/purchases', { price_paid_cents: 1000 })
    expect(api.post).toHaveBeenCalledWith('/api/marketplace/i-1/reviews', { rating: 5, body: 'Excellent' })
  })
})
