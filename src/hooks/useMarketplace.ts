import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type MarketplaceItem = {
  id: string
  seller_id: string
  name: string
  slug: string
  short_desc?: string
  category?: string
  item_type?: string
  price_cents?: number
  currency?: string
  status?: string
}

export type MarketplacePurchase = {
  id: string
  item_id: string
  buyer_id: string
  org_id?: string
  payment_id?: string
  price_paid_cents?: number
  currency?: string
}

export type MarketplaceReview = {
  id: string
  item_id: string
  reviewer_id: string
  rating: number
  body?: string
}

const marketplaceKeys = {
  all: ['marketplace'] as const,
  list: (page: number, limit: number, category?: string) => [...marketplaceKeys.all, 'list', page, limit, category ?? 'all'] as const,
  detail: (itemId: string) => [...marketplaceKeys.all, 'detail', itemId] as const,
  purchases: (itemId: string, page: number, limit: number) => [...marketplaceKeys.all, 'purchases', itemId, page, limit] as const,
  myPurchases: (page: number, limit: number) => [...marketplaceKeys.all, 'my-purchases', page, limit] as const,
  reviews: (itemId: string, page: number, limit: number) => [...marketplaceKeys.all, 'reviews', itemId, page, limit] as const,
}

export const useMarketplaceItems = (enabled = true, page = 1, limit = 20, category?: string) =>
  useQuery({
    queryKey: marketplaceKeys.list(page, limit, category),
    enabled,
    queryFn: () =>
      api
        .get<{ items: MarketplaceItem[]; page: number; limit: number }>('/api/marketplace', {
          params: { page, limit, category },
        })
        .then((r) => r.data),
  })

export const useMarketplaceItem = (itemId: string, enabled = true) =>
  useQuery({
    queryKey: marketplaceKeys.detail(itemId),
    enabled: enabled && !!itemId,
    queryFn: () => api.get<MarketplaceItem>(`/api/marketplace/${itemId}`).then((r) => r.data),
  })

export const useCreateMarketplaceItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      name: string
      slug: string
      short_desc?: string
      category?: string
      item_type?: string
      price_cents?: number
      org_id?: string
    }) => api.post<{ id: string }>('/api/marketplace', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: marketplaceKeys.all }),
  })
}

export const usePublishItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => api.post<{ id: string }>(`/api/marketplace/${itemId}/publish`).then((r) => r.data),
    onSuccess: (_data, itemId) => {
      qc.invalidateQueries({ queryKey: marketplaceKeys.detail(itemId) })
      qc.invalidateQueries({ queryKey: marketplaceKeys.all })
    },
  })
}

export const usePurchaseItem = (itemId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload?: { org_id?: string; payment_id?: string; price_paid_cents?: number; currency?: string }) =>
      api.post<{ id: string }>(`/api/marketplace/${itemId}/purchases`, payload ?? {}).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marketplaceKeys.purchases(itemId, 1, 20).slice(0, 3) })
      qc.invalidateQueries({ queryKey: marketplaceKeys.myPurchases(1, 20).slice(0, 3) })
    },
  })
}

export const useItemPurchases = (itemId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: marketplaceKeys.purchases(itemId, page, limit),
    enabled: enabled && !!itemId,
    queryFn: () => api.get<{ purchases: MarketplacePurchase[]; page: number; limit: number }>(`/api/marketplace/${itemId}/purchases`, { params: { page, limit } }).then((r) => r.data),
  })

export const useMyPurchases = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: marketplaceKeys.myPurchases(page, limit),
    enabled,
    queryFn: () => api.get<{ purchases: MarketplacePurchase[]; page: number; limit: number }>('/api/marketplace/my-purchases', { params: { page, limit } }).then((r) => r.data),
  })

export const useItemReviews = (itemId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: marketplaceKeys.reviews(itemId, page, limit),
    enabled: enabled && !!itemId,
    queryFn: () => api.get<{ reviews: MarketplaceReview[]; page: number; limit: number }>(`/api/marketplace/${itemId}/reviews`, { params: { page, limit } }).then((r) => r.data),
  })

export const useWriteReview = (itemId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { rating: number; body?: string }) => api.post<{ id: string }>(`/api/marketplace/${itemId}/reviews`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: marketplaceKeys.reviews(itemId, 1, 20).slice(0, 3) }),
  })
}

export const useDeleteReview = (itemId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: string) => api.delete<{ deleted: boolean }>(`/api/marketplace/${itemId}/reviews/${reviewId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: marketplaceKeys.reviews(itemId, 1, 20).slice(0, 3) }),
  })
}
