import { useMemo } from 'react'
import { useBulkUpsertNotificationPrefs, useNotificationPrefs } from '../../hooks/useNotificationPrefs'
import { useUiStore } from '../../stores/uiStore'

const preferenceRows = [
  { notification_type: 'new_follower', channel: 'email', label: 'Email: New followers' },
  { notification_type: 'article_published', channel: 'email', label: 'Email: Article published' },
  { notification_type: 'comment_reply', channel: 'email', label: 'Email: Comment replies' },
  { notification_type: 'new_follower', channel: 'push', label: 'Push: New followers' },
  { notification_type: 'comment_reply', channel: 'push', label: 'Push: Comment replies' },
  { notification_type: 'approval_status', channel: 'push', label: 'Push: Approval status' },
]

type Pref = {
  notification_type: string
  channel: string
  is_enabled: boolean
}

export default function NotificationPrefsPanel() {
  const toast = useUiStore((s) => s.toast)
  const prefs = useNotificationPrefs(true)
  const bulkUpdate = useBulkUpsertNotificationPrefs()

  const current = useMemo(() => {
    const list = (prefs.data?.preferences ?? []) as Pref[]
    const map: Record<string, boolean> = {}
    for (const item of list) {
      map[`${item.notification_type}:${item.channel}`] = Boolean(item.is_enabled)
    }
    return map
  }, [prefs.data])

  const handleToggle = async (notification_type: string, channel: string, is_enabled: boolean) => {
    try {
      await bulkUpdate.mutateAsync([{ notification_type, channel, is_enabled }])
      toast('Notification preference updated', 'success')
    } catch {
      toast('Could not update preference', 'error')
    }
  }

  return (
    <div className='mt-5 space-y-4'>
      {preferenceRows.map((row) => {
        const key = `${row.notification_type}:${row.channel}`
        const enabled = current[key] ?? true
        return (
          <label key={key} className='flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] px-4 py-3'>
            <span className='text-sm text-[color:var(--text-primary)]'>{row.label}</span>
            <button
              type='button'
              role='switch'
              aria-checked={enabled}
              onClick={() => void handleToggle(row.notification_type, row.channel, !enabled)}
              className={[
                'relative inline-flex h-6 w-11 items-center rounded-full border transition-colors',
                enabled
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)]'
                  : 'border-[color:var(--border-strong)] bg-[color:var(--surface-2)]',
              ].join(' ')}
            >
              <span
                aria-hidden='true'
                className={[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  enabled ? 'translate-x-5' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
          </label>
        )
      })}
      {prefs.isLoading && <p className='text-sm text-[color:var(--text-muted)]'>Loading preferences...</p>}
    </div>
  )
}
