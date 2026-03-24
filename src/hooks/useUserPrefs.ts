import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { UserPrefs } from '../types'

export const useUserPrefs = () =>
  useQuery({
    queryKey: ['users', 'me', 'prefs'],
    queryFn: () => api.get<{ prefs: UserPrefs }>('/api/users/me/prefs').then(r => r.data.prefs),
  })

export const useUpdateUserPrefs = () =>
  useMutation({
    mutationFn: (prefs: UserPrefs) => api.put('/api/users/me/prefs', prefs),
  })
