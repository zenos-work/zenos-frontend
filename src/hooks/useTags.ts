import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { Tag } from '../types'

export const useTags = () =>
  useQuery({
    queryKey: ['tags', 'all'],
    queryFn: () => api.get<{ tags: Tag[] }>('/api/tags').then(r => r.data.tags),
    staleTime: 1000 * 60 * 15,
  })
