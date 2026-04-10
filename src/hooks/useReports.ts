import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'

export const useSubmitReport = () =>
  useMutation({
    mutationFn: (payload: {
      resource_type: string
      resource_id: string
      reason: string
      detail_text?: string
      org_id?: string
    }) => api.post('/api/reports', payload).then((r) => r.data),
  })
