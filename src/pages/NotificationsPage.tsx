import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  DollarSign,
  Heart,
  MessageCircle,
  TrendingUp,
  UserPlus,
  Trash2,
} from 'lucide-react'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useDeleteAllNotifications,
  useDeleteNotification,
} from '../hooks/useAdmin'
import Spinner from '../components/ui/Spinner'
import type { Notification } from '../types'

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default function NotificationsPage() {
  const { data, isLoading, isError } = useNotifications()
  const markAllReadMutation = useMarkAllNotificationsRead()
  const markOneReadMutation = useMarkNotificationRead()
  const deleteAllMutation = useDeleteAllNotifications()
  const deleteOneMutation = useDeleteNotification()
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'comment' | 'follower' | 'system'>('all')
  const [localRead, setLocalRead] = useState<Record<string, boolean>>({})

  const notifications = data?.notifications ?? []

  const isRead = (notification: Notification) => {
    if (notification.id in localRead) return localRead[notification.id]
    return Boolean(notification.is_read)
  }

  const normalizeType = (notification: Notification): 'comment' | 'follower' | 'system' => {
    const type = notification.type.toLowerCase()
    if (type.includes('comment') || type.includes('reply')) return 'comment'
    if (type.includes('follow')) return 'follower'
    return 'system'
  }

  const unreadCount = notifications.filter((notification) => !isRead(notification)).length

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !isRead(notification)
    return normalizeType(notification) === activeTab
  })

  const markAllRead = () => {
    const next: Record<string, boolean> = {}
    notifications.forEach((notification) => {
      next[notification.id] = true
    })
    setLocalRead((prev) => ({ ...prev, ...next }))
    markAllReadMutation.mutate()
  }

  const markRead = (notificationId: string) => {
    setLocalRead((prev) => ({ ...prev, [notificationId]: true }))
    markOneReadMutation.mutate(notificationId)
  }

  const iconFor = (notification: Notification) => {
    const type = notification.type.toLowerCase()
    if (type.includes('follow')) return <UserPlus size={16} />
    if (type.includes('comment') || type.includes('reply')) return <MessageCircle size={16} />
    if (type.includes('publish') || type.includes('approval')) return <CheckCircle2 size={16} />
    if (type.includes('earning') || type.includes('revenue')) return <DollarSign size={16} />
    if (type.includes('milestone') || type.includes('trend')) return <TrendingUp size={16} />
    if (type.includes('like') || type.includes('reaction')) return <Heart size={16} />
    return <AlertCircle size={16} />
  }

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

  return (
    <div className='space-y-5'>
      <header className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <div className='grid h-10 w-10 place-items-center rounded-full bg-[color:var(--accent-dim)] text-[color:var(--accent)]'>
            <Bell size={18} />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Notifications</h1>
            <p className='text-sm text-[color:var(--text-secondary)]'>Recent workflow, publication, and social activity.</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <span className='rounded-full bg-[color:var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[color:var(--text-secondary)]'>
            {unreadCount} unread
          </span>
          {unreadCount > 0 && (
            <button
              type='button'
              onClick={markAllRead}
              disabled={markAllReadMutation.isPending}
              className='rounded-full border border-[color:var(--border-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] disabled:opacity-60'
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type='button'
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all notifications?')) {
                  deleteAllMutation.mutate()
                }
              }}
              disabled={deleteAllMutation.isPending}
              className='flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600 hover:bg-rose-50 disabled:opacity-60'
            >
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </header>

      <div className='flex gap-2 overflow-x-auto pb-1'>
        {[
          { id: 'all' as const, label: 'All' },
          { id: 'unread' as const, label: `Unread (${unreadCount})` },
          { id: 'comment' as const, label: 'Comments' },
          { id: 'follower' as const, label: 'Followers' },
          { id: 'system' as const, label: 'System' },
        ].map((tab) => (
          <button
            key={tab.id}
            type='button'
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              activeTab === tab.id
                ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                : 'border-[color:var(--border)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-strong)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!filteredNotifications.length ? (
        <div className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-6 py-10 text-center'>
          <CheckCircle2 className='mx-auto mb-3 text-[color:var(--text-muted)]' size={28} />
          <p className='text-[color:var(--text-primary)] font-medium'>No notifications in this view.</p>
          <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Try another filter or check back soon.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredNotifications.map((notification) => {
            const articleHref = notification.article_id ? `/article/${notification.article_id}` : null
            const read = isRead(notification)
            const normalizedType = normalizeType(notification)

            return (
              <div
                key={notification.id}
                className={`rounded-2xl border px-5 py-4 ${
                  read
                    ? 'border-[color:var(--border)] bg-[color:var(--surface-1)]'
                    : 'border-[color:var(--accent)]/40 bg-[color:var(--accent-dim)]/35'
                }`}
              >
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex min-w-0 gap-3'>
                    <div className='mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[color:var(--surface-2)] text-[color:var(--text-secondary)]'>
                      {iconFor(notification)}
                    </div>
                    <div className='space-y-1'>
                      <p className='text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]'>
                        {normalizedType}
                      </p>
                      <p className='text-base text-[color:var(--text-primary)]'>{notification.message}</p>
                      <p className='text-xs text-[color:var(--text-secondary)]'>{formatTimestamp(notification.created_at)}</p>
                    </div>
                  </div>
                  {read ? (
                    <span className='rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700'>Read</span>
                  ) : (
                    <span className='rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700'>New</span>
                  )}
                </div>

                <div className='mt-3 flex flex-wrap items-center gap-3'>
                  {!read && (
                    <button
                      type='button'
                      onClick={() => markRead(notification.id)}
                      disabled={markOneReadMutation.isPending}
                      className='text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)] hover:underline disabled:opacity-60'
                    >
                      Mark read
                    </button>
                  )}

                  <button
                    type='button'
                    onClick={() => {
                      if (window.confirm('Delete this notification?')) {
                        deleteOneMutation.mutate(notification.id)
                      }
                    }}
                    disabled={deleteOneMutation.isPending}
                    className='text-xs font-semibold uppercase tracking-wide text-rose-500 hover:underline disabled:opacity-60'
                  >
                    Delete
                  </button>

                  {articleHref && (
                    <Link
                      to={articleHref}
                      className='text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)] hover:underline'
                    >
                      Open related article
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
