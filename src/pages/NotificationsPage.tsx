import { Link } from 'react-router-dom'
import { Bell, CheckCircle2 } from 'lucide-react'
import { useNotifications } from '../hooks/useAdmin'
import Spinner from '../components/ui/Spinner'

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default function NotificationsPage() {
  const { data, isLoading, isError } = useNotifications()

  if (isLoading) {
    return <div className='flex justify-center py-12'><Spinner /></div>
  }

  if (isError) {
    return (
      <div className='rounded-xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700'>
        Failed to load notifications.
      </div>
    )
  }

  const notifications = data?.notifications ?? []

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <div className='grid h-10 w-10 place-items-center rounded-full bg-[color:var(--accent-dim)] text-[color:var(--accent)]'>
          <Bell size={18} />
        </div>
        <div>
          <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Notifications</h1>
          <p className='text-sm text-[color:var(--text-secondary)]'>Recent workflow, publication, and social activity.</p>
        </div>
      </div>

      {!notifications.length ? (
        <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-6 py-10 text-center'>
          <CheckCircle2 className='mx-auto mb-3 text-[color:var(--text-muted)]' size={28} />
          <p className='text-[color:var(--text-primary)] font-medium'>No notifications yet.</p>
          <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>You will see approvals, rejections, publications, and engagement updates here.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {notifications.map((notification) => {
            const articleHref = notification.article_id ? `/article/${notification.article_id}` : null

            return (
              <div
                key={notification.id}
                className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-5 py-4'
              >
                <div className='flex items-start justify-between gap-4'>
                  <div className='space-y-1'>
                    <p className='text-sm font-semibold uppercase tracking-wide text-[color:var(--text-muted)]'>
                      {notification.type}
                    </p>
                    <p className='text-base text-[color:var(--text-primary)]'>{notification.message}</p>
                    <p className='text-xs text-[color:var(--text-secondary)]'>{formatTimestamp(notification.created_at)}</p>
                  </div>
                  {notification.is_read ? (
                    <span className='rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700'>Read</span>
                  ) : (
                    <span className='rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700'>New</span>
                  )}
                </div>
                {articleHref && (
                  <div className='mt-3'>
                    <Link
                      to={articleHref}
                      className='text-sm font-medium text-[color:var(--accent)] hover:underline'
                    >
                      Open related article
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
