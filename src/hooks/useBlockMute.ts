import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

const blockMuteKeys = {
  all: ['block-mute'] as const,
  blocked: () => [...blockMuteKeys.all, 'blocked'] as const,
  muted: () => [...blockMuteKeys.all, 'muted'] as const,
}

export const useBlockedUsers = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: [...blockMuteKeys.blocked(), page, limit],
    enabled,
    queryFn: () => api.get('/api/users/me/blocks', { params: { page, limit } }).then((r) => r.data),
  })

export const useMutedUsers = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: [...blockMuteKeys.muted(), page, limit],
    enabled,
    queryFn: () => api.get('/api/users/me/mutes', { params: { page, limit } }).then((r) => r.data),
  })

export const useBlockUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      api.post(`/api/users/me/blocks/${userId}`, { reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blockMuteKeys.blocked() })
    },
  })
}

export const useUnblockUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/api/users/me/blocks/${userId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blockMuteKeys.blocked() })
    },
  })
}

export const useMuteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      api.post(`/api/users/me/mutes/${userId}`, { reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blockMuteKeys.muted() })
    },
  })
}

export const useUnmuteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/api/users/me/mutes/${userId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blockMuteKeys.muted() })
    },
  })
}
