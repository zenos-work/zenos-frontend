import { useMutation } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export const useRequestDataExport = () =>
  useMutation({
    mutationFn: () => api.post('/api/users/me/data-export').then((r) => r.data),
  })

export const useDataExportStatus = (requestId: string, enabled = true) =>
  useQuery({
    queryKey: ['compliance', 'export', requestId],
    enabled: enabled && !!requestId,
    queryFn: () => api.get(`/api/users/me/data-export/${requestId}`).then((r) => r.data),
    refetchInterval: 10000,
  })

export const useRequestAccountErasure = () =>
  useMutation({
    mutationFn: (payload: { password_confirmed: boolean }) =>
      api.post('/api/users/me/erase', payload).then((r) => r.data),
  })
