import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { Tag } from '../types'

interface UseTagsOptions {
  onboarding?: boolean
}

export const useTags = (options: UseTagsOptions = {}) =>
  useQuery({
    queryKey: ['tags', options.onboarding ? 'onboarding' : 'all'],
    queryFn: () => api.get<{ tags: Tag[] }>('/api/tags', {
      params: options.onboarding ? { onboarding: 1 } : undefined,
    }).then(r => r.data.tags),
    staleTime: 1000 * 60 * 15,
  })
