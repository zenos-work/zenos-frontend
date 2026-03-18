import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { AdminStats, ArticleDetail, User, PaginationMeta, Notification } from '../types'

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

export const useAdminStats = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'stats'],
    enabled,
    queryFn:  () =>
      api.get<AdminStats>('/api/admin/stats').then(r => r.data),
  })

export const useApprovalQueue = (page = 1) =>
  useQuery({
    queryKey: ['admin', 'queue', page],
    queryFn:  () =>
      api.get<ApprovalQueueResponse>('/api/admin/queue', { params: { page } })
         .then(r => r.data),
  })

export const useAdminUsers = (page = 1, enabled = true) =>
  useQuery({
    queryKey: ['admin', 'users', page],
    enabled,
    queryFn:  () =>
      api.get<AdminUsersResponse>('/api/admin/users', { params: { page } })
         .then(r => r.data),
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

export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn:  () =>
      api.get<NotificationsResponse>('/api/admin/notifications')
         .then(r => r.data),
  })
