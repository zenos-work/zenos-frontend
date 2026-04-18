import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export const notificationPrefKeys = {
  all: ['notification-prefs'] as const,
  prefs: () => [...notificationPrefKeys.all, 'prefs'] as const,
  push: () => [...notificationPrefKeys.all, 'push'] as const,
}

export const useNotificationPrefs = (enabled = true) =>
  useQuery({
    queryKey: notificationPrefKeys.prefs(),
    enabled,
    queryFn: () => api.get('/api/notification-prefs').then((r) => r.data),
  })

export const useUpsertNotificationPref = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { notification_type: string; channel: string; is_enabled: boolean }) =>
      api.post('/api/notification-prefs', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationPrefKeys.prefs() })
    },
  })
}

export const useBulkUpsertNotificationPrefs = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (preferences: Array<{ notification_type: string; channel: string; is_enabled: boolean }>) =>
      api.put('/api/notification-prefs', { preferences }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationPrefKeys.prefs() })
    },
  })
}

export const usePushSubscriptions = (enabled = true) =>
  useQuery({
    queryKey: notificationPrefKeys.push(),
    enabled,
    queryFn: () => api.get('/api/notification-prefs/push').then((r) => r.data),
  })

export const useRegisterPushSub = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      platform?: string
      endpoint: string
      p256dh_key: string
      auth_key: string
      device_name?: string
    }) => api.post('/api/notification-prefs/push', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationPrefKeys.push() })
    },
  })
}

export const useUnregisterPushSub = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (subscriptionId: string) => api.delete(`/api/notification-prefs/push/${subscriptionId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationPrefKeys.push() })
    },
  })
}
