import { useRevokeSession, useMyActiveSessions } from '../../hooks/useSessions'
import { useUiStore } from '../../stores/uiStore'

type SessionRow = {
  id: string
  device_name?: string
  platform?: string
  last_seen_at?: string
  created_at?: string
}

export default function ActiveSessionsPanel() {
  const toast = useUiStore((s) => s.toast)
  const sessions = useMyActiveSessions(true)
  const revoke = useRevokeSession()

  const items = ((sessions.data as { items?: SessionRow[]; sessions?: SessionRow[] } | undefined)?.items
    ?? (sessions.data as { sessions?: SessionRow[] } | undefined)?.sessions
    ?? []) as SessionRow[]

  const handleRevoke = async (sessionId: string) => {
    try {
      await revoke.mutateAsync(sessionId)
      toast('Session revoked', 'success')
    } catch {
      toast('Could not revoke session', 'error')
    }
  }

  return (
    <div className='mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
      <h3 className='text-sm font-semibold text-[color:var(--text-primary)]'>Active sessions</h3>
      <div className='mt-3 space-y-2'>
        {items.length === 0 ? (
          <p className='text-xs text-[color:var(--text-muted)]'>No active sessions found.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className='flex items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2'>
              <div>
                <p className='text-sm text-[color:var(--text-primary)]'>{item.device_name || item.platform || 'Unknown device'}</p>
                <p className='text-xs text-[color:var(--text-muted)]'>
                  Last seen {item.last_seen_at || item.created_at || 'unknown'}
                </p>
              </div>
              <button
                type='button'
                onClick={() => void handleRevoke(item.id)}
                className='rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
              >
                Revoke
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
