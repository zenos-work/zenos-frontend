import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export const sessionKeys = {
  all: ['sessions'] as const,
  list: (page: number, limit: number) => [...sessionKeys.all, page, limit] as const,
}

export const useMyActiveSessions = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: sessionKeys.list(page, limit),
    enabled,
    queryFn: () => api.get('/api/users/me/sessions', { params: { page, limit } }).then((r) => r.data),
  })

export const useRevokeSession = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => api.delete(`/api/users/me/sessions/${sessionId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionKeys.all })
    },
  })
}
