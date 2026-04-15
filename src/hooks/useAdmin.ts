import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type {
  AdminStats,
  AdminSuccessSignalHistoryResponse,
  AdminSuccessSignalsResponse,
  AdminRankingResponse,
  RankingWeights,
  ArticleDetail,
  User,
  PaginationMeta,
  Notification,
  Comment,
  FeatureFlagAdmin,
  FeatureFlagListResponse,
  FeatureAnnouncementPreview,
  FeatureFlagMetadata,
  FeatureFlagTargetType,
} from '../types'

type ApprovalQueueResponse = {
  queue: ArticleDetail[]
  pagination: PaginationMeta
}

type AdminUsersResponse = {
  users: User[]
  pagination: PaginationMeta
}

type NotificationsResponse = {
  notifications: Notification[]
  pagination: PaginationMeta
}

type BulkQueueActionResponse = {
  action: 'approve' | 'publish' | 'reject'
  processed: number
  succeeded: number
  failed: number
  results: Array<{
    article_id: string
    ok: boolean
    status?: string
    error?: string
  }>
}

type ModerationCommentsResponse = {
  data: Comment[]
  pagination: PaginationMeta
}

type FeatureFlagPayload = {
  flag_key: string
  name: string
  description?: string
  category: string
  is_active: boolean
  target_type: FeatureFlagTargetType
  targets: string[]
  rollout_pct: number
  metadata?: FeatureFlagMetadata
}

export const useAdminStats = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'stats'],
    enabled,
    queryFn:  () =>
      api.get<AdminStats>('/api/admin/stats').then(r => r.data),
  })

export const useAdminRanking = (limit = 10, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'ranking', limit],
    enabled,
    queryFn: () =>
      api.get<AdminRankingResponse>('/api/admin/ranking', { params: { limit } }).then(r => r.data),
  })

export const useAdminRankingWeights = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'ranking-weights'],
    enabled,
    queryFn: () =>
      api.get<{ weights: RankingWeights }>('/api/admin/ranking-weights').then(r => r.data.weights),
  })

export const useUpdateAdminRankingWeights = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (weights: Partial<RankingWeights>) =>
      api.put<{ weights: RankingWeights }>('/api/admin/ranking-weights', weights).then(r => r.data.weights),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'ranking-weights'] })
      qc.invalidateQueries({ queryKey: ['admin', 'ranking'] })
    },
  })
}

export const useApprovalQueue = (page = 1, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'queue', page],
    enabled,
    queryFn:  () =>
      api.get<ApprovalQueueResponse>('/api/admin/queue', { params: { page } })
         .then(r => r.data),
  })

export const useBulkQueueAction = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      action: 'approve' | 'publish' | 'reject'
      article_ids: string[]
      note?: string
    }) => api.post<BulkQueueActionResponse>('/api/admin/queue/bulk', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'queue'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

export const useAdminUsers = (page = 1, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'users', page],
    enabled,
    queryFn:  () =>
      api.get<AdminUsersResponse>('/api/admin/users', { params: { page } })
         .then(r => r.data),
  })

export const useAdminSuccessSignals = (page = 1, limit = 10, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'success-signals', page, limit],
    enabled,
    queryFn: () =>
      api.get<AdminSuccessSignalsResponse>('/api/admin/success-signals', { params: { page, limit } })
        .then(r => r.data),
  })

export const useAdminSuccessSignalHistory = (articleId: string, hours = 12, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'success-signals', 'history', articleId, hours],
    enabled: enabled && !!articleId,
    queryFn: () =>
      api.get<AdminSuccessSignalHistoryResponse>('/api/admin/success-signals/history', {
        params: { article_id: articleId, hours },
      }).then(r => r.data),
  })

export const useBanUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      api.put(`/api/admin/users/${userId}/ban`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export const useUnbanUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      api.put(`/api/admin/users/${userId}/unban`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export const useNotifications = (enabled = true) =>
  useQuery({
    queryKey: ['notifications'],
    enabled,
    queryFn:  () =>
      api.get<NotificationsResponse>('/api/admin/notifications')
         .then(r => r.data),
  })

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.put('/api/admin/notifications/read'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export const useMarkNotificationRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) => api.put(`/api/admin/notifications/${notificationId}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export const useDeleteNotification = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) => api.delete(`/api/admin/notifications/${notificationId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export const useDeleteAllNotifications = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/api/admin/notifications/all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export const useModerationComments = (page = 1, limit = 20, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'comments', page, limit],
    enabled,
    queryFn: () =>
      api.get<ModerationCommentsResponse>('/api/comments/admin/all', { params: { page, limit } }).then(r => r.data),
  })

export const useModerateComment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, is_hidden, reason }: { commentId: string; is_hidden: boolean; reason?: string }) =>
      api.put(`/api/comments/${commentId}/moderate`, { is_hidden, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'comments'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export const useAdminFeatureFlags = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'feature-flags'],
    enabled,
    queryFn: () =>
      api.get<FeatureFlagListResponse>('/api/admin/feature-flags').then((r) => r.data),
  })

export const useCreateAdminFeatureFlag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: FeatureFlagPayload) =>
      api.post<FeatureFlagAdmin>('/api/admin/feature-flags', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'feature-flags'] })
    },
  })
}

export const useUpdateAdminFeatureFlag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ flagId, payload }: { flagId: string; payload: Partial<FeatureFlagPayload> }) =>
      api.put<FeatureFlagAdmin>(`/api/admin/feature-flags/${flagId}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'feature-flags'] })
    },
  })
}

export const useDeleteAdminFeatureFlag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (flagId: string) => api.delete(`/api/admin/feature-flags/${flagId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'feature-flags'] })
    },
  })
}

export const usePreviewFeatureAnnouncement = () =>
  useMutation({
    mutationFn: (payload: Partial<FeatureFlagPayload> & { action: 'enabled' | 'disabled' }) =>
      api.post<FeatureAnnouncementPreview>('/api/admin/feature-flags/preview-announcement', payload).then((r) => r.data),
  })

export const useAdminEarningsCalculate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      period_start: string
      period_end: string
      active_subscribers: number
      payout_ratio?: number
      min_payout_cents?: number
    }) => api.post('/api/admin/earnings/calculate', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export const useAdminEarningsPeriod = (period: string, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'earnings', 'period', period],
    enabled: enabled && !!period,
    queryFn: () => api.get(`/api/admin/earnings/period/${period}`).then((r) => r.data),
  })

export const useAdminBillingReconciliation = (period: string, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'billing', 'reconciliation', period],
    enabled: enabled && !!period,
    queryFn: () => api.get(`/api/admin/billing/reconciliation/${period}`).then((r) => r.data),
  })

export const useAdminRunReconciliation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { period: string; threshold_cents?: number }) => api.post('/api/admin/billing/reconcile', payload).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'billing', 'reconciliation', vars.period] })
    },
  })
}

export const useErasureQueue = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'compliance', 'erasure-queue'],
    enabled,
    queryFn: () => api.get<{ items: Array<Record<string, unknown>> }>('/api/admin/compliance/erasure-queue').then((r) => r.data),
  })

export const useApproveArticle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (articleId: string) => api.post(`/api/articles/${articleId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'queue'] })
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

export const usePublishArticle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (articleId: string) => api.post(`/api/articles/${articleId}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'queue'] })
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

export const useRejectArticle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ articleId, note }: { articleId: string; note: string }) =>
      api.post(`/api/articles/${articleId}/reject`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'queue'] })
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

export const useExecuteErasure = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => api.post(`/api/admin/compliance/erasure/${requestId}/execute`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'compliance', 'erasure-queue'] })
    },
  })
}
