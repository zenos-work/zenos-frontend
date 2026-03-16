import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { AdminStats, ArticleDetail, User } from '../types'

export const useAdminStats = () =>
  useQuery({
    queryKey: ['admin', 'stats'],
    queryFn:  () =>
      api.get<AdminStats>('/api/admin/stats').then(r => r.data),
  })

export const useApprovalQueue = () =>
  useQuery({
    queryKey: ['admin', 'queue'],
    queryFn:  () =>
      api.get<{ queue: ArticleDetail[] }>('/api/admin/queue')
         .then(r => r.data.queue),
  })

export const useAdminUsers = (page = 1) =>
  useQuery({
    queryKey: ['admin', 'users', page],
    queryFn:  () =>
      api.get<{ users: User[] }>('/api/admin/users', { params: { page } })
         .then(r => r.data.users),
  })

export const useBanUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      api.put(`/api/admin/users/${userId}/ban`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn:  () =>
      api.get<{ notifications: any[] }>('/api/admin/notifications')
         .then(r => r.data.notifications),
  })
