import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import {
  useAdminStats,
  useApprovalQueue,
  useAdminUsers,
  useBanUser,
  useUnbanUser,
} from '../hooks/useAdmin'
import { useUiStore } from '../stores/uiStore'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import {
  Shield,
  Users,
  BarChart2,
  InboxIcon,
  CheckCircle,
  XCircle,
  Radio,
  AlertTriangle,
  Activity,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { ArticleDetail } from '../types'

type Tab = 'stats' | 'queue' | 'users'
type ModerationAction = 'approve' | 'publish' | 'reject'

export default function AdminPage() {
  const { user } = useAuth()
  const toast = useUiStore((s) => s.toast)
  const qc = useQueryClient()

  const isSuperadmin = user?.role === 'SUPERADMIN'

  const [tab, setTab] = useState<Tab>('queue')
  const [queuePage, setQueuePage] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const [rejectArticle, setRejectArticle] = useState<ArticleDetail | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [actionState, setActionState] = useState<{
    id: string
    action: ModerationAction
  } | null>(null)

  useEffect(() => {
    if (!isSuperadmin && tab !== 'queue') setTab('queue')
  }, [isSuperadmin, tab])

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useAdminStats(isSuperadmin)
  const {
    data: queue,
    isLoading: queueLoading,
    isError: queueError,
  } = useApprovalQueue(queuePage)
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
  } = useAdminUsers(usersPage, isSuperadmin)

  const banMutation = useBanUser()
  const unbanMutation = useUnbanUser()

  const approveMutation = useMutation({
    mutationFn: (articleId: string) => api.post(`/api/articles/${articleId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'queue'] })
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: (articleId: string) => api.post(`/api/articles/${articleId}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'queue'] })
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ articleId, note }: { articleId: string; note: string }) =>
      api.post(`/api/articles/${articleId}/reject`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'queue'] })
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
  })

  const queueItems = queue?.queue ?? []
  const queueMeta = queue?.pagination
  const userItems = users?.users ?? []
  const usersMeta = users?.pagination

  const statusChart = useMemo(
    () => (stats?.articles_by_status ?? []).map((row) => ({
      label: row.status,
      value: row.c,
    })),
    [stats?.articles_by_status],
  )

  const roleChart = useMemo(
    () => (stats?.governance?.users_by_role ?? []).map((row) => ({
      label: row.role,
      value: row.c,
    })),
    [stats?.governance?.users_by_role],
  )

  const activityChart = useMemo(
    () => [
      { label: 'Published', value: stats?.governance?.recent_activity?.published_7d ?? 0 },
      { label: 'Approved', value: stats?.governance?.recent_activity?.approved_7d ?? 0 },
      { label: 'Rejected', value: stats?.governance?.recent_activity?.rejected_7d ?? 0 },
      { label: 'Notifications', value: stats?.governance?.recent_activity?.notifications_7d ?? 0 },
      { label: 'Flagged comments', value: stats?.governance?.moderation?.flagged_comments ?? 0 },
      { label: 'Hidden comments', value: stats?.governance?.moderation?.hidden_comments ?? 0 },
    ],
    [stats],
  )

  const shownTabs = useMemo(
    () =>
      isSuperadmin
        ? [
            { id: 'stats' as const, icon: BarChart2, label: 'Stats' },
            { id: 'queue' as const, icon: InboxIcon, label: 'Queue', badge: queueMeta?.total ?? queueItems.length },
            { id: 'users' as const, icon: Users, label: 'Users' },
          ]
        : [
            { id: 'queue' as const, icon: InboxIcon, label: 'Queue', badge: queueMeta?.total ?? queueItems.length },
          ],
    [isSuperadmin, queueItems.length, queueMeta?.total],
  )

  const runQueueAction = async (action: ModerationAction, article: ArticleDetail, note?: string) => {
    try {
      setActionState({ id: article.id, action })
      if (action === 'approve') {
        await approveMutation.mutateAsync(article.id)
        toast(`Approved: ${article.title}`, 'success')
      }
      if (action === 'publish') {
        await publishMutation.mutateAsync(article.id)
        toast(`Published: ${article.title}`, 'success')
      }
      if (action === 'reject') {
        await rejectMutation.mutateAsync({ articleId: article.id, note: note ?? '' })
        toast(`Rejected: ${article.title}`, 'success')
      }
    } catch {
      toast(`Failed to ${action} article`, 'error')
    } finally {
      setActionState(null)
    }
  }

  const handleBan = async (userId: string, name: string) => {
    if (!confirm(`Ban ${name}?`)) return
    try {
      await banMutation.mutateAsync(userId)
      toast(`${name} banned`, 'success')
    } catch {
      toast('Failed to ban user', 'error')
    }
  }

  const handleUnban = async (userId: string, name: string) => {
    if (!confirm(`Unban ${name}?`)) return
    try {
      await unbanMutation.mutateAsync(userId)
      toast(`${name} unbanned`, 'success')
    } catch {
      toast('Failed to unban user', 'error')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Shield size={20} className='text-orange-400' />
          <h1 className='text-xl font-bold text-white'>Admin</h1>
        </div>
        <Badge variant='warning'>{user?.role}</Badge>
      </div>

      {!isSuperadmin && (
        <div className='rounded-xl border border-amber-800/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200'>
          <p className='font-medium'>Approver view</p>
          <p className='text-amber-300/80 mt-0.5'>
            You can manage article approvals. User governance and global stats are SUPERADMIN-only.
          </p>
        </div>
      )}

      <div className='flex gap-1 border-b border-gray-800 overflow-x-auto'>
        {shownTabs.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === id ? 'text-white border-orange-500' : 'text-gray-400 border-transparent hover:text-white',
            ].join(' ')}
          >
            <Icon size={15} />
            {label}
            {badge != null && badge > 0 && (
              <span className='ml-1 px-1.5 py-0.5 rounded-full text-xs bg-orange-600 text-white'>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'stats' && isSuperadmin && (
        statsLoading ? <Spinner /> : statsError ? (
          <ErrorPanel message='Failed to load admin stats.' />
        ) : stats ? (
          <div className='space-y-6'>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              <StatsCard label='Active users' value={stats.total_users} />
              <StatsCard label='Comments' value={stats.total_comments} />
              <StatsCard label='Pending approvals' value={stats.governance?.moderation?.pending_approvals ?? 0} />
              <StatsCard label='Notifications (7d)' value={stats.governance?.recent_activity?.notifications_7d ?? 0} />
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
              {stats.articles_by_status.map((row) => (
                <StatsCard key={row.status} label={row.status} value={row.c} />
              ))}
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
              <ChartCard title='Article status distribution' icon={BarChart2} items={statusChart} />
              <ChartCard title='Users by role' icon={Users} items={roleChart} />
              <ChartCard title='Governance activity (7d)' icon={Activity} items={activityChart} />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              <div className='rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3'>
                <div className='flex items-center gap-2 text-gray-300'>
                  <Users size={15} />
                  <h2 className='text-sm font-semibold'>Users by role</h2>
                </div>
                <div className='space-y-2'>
                  {(stats.governance?.users_by_role ?? []).map((row) => (
                    <StatRow key={row.role} label={row.role} value={row.c} />
                  ))}
                </div>
              </div>

              <div className='rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3'>
                <div className='flex items-center gap-2 text-gray-300'>
                  <Activity size={15} />
                  <h2 className='text-sm font-semibold'>Recent governance activity (7d)</h2>
                </div>
                <div className='space-y-2'>
                  <StatRow label='Published' value={stats.governance?.recent_activity?.published_7d ?? 0} />
                  <StatRow label='Approved' value={stats.governance?.recent_activity?.approved_7d ?? 0} />
                  <StatRow label='Rejected' value={stats.governance?.recent_activity?.rejected_7d ?? 0} />
                  <StatRow label='Flagged comments' value={stats.governance?.moderation?.flagged_comments ?? 0} />
                  <StatRow label='Hidden comments' value={stats.governance?.moderation?.hidden_comments ?? 0} />
                </div>
              </div>
            </div>

            <div className='rounded-xl border border-gray-800 bg-gray-900 p-4'>
              <h2 className='text-sm font-semibold text-gray-300 mb-3'>Top articles</h2>
              {stats.top_articles.length === 0 ? (
                <p className='text-sm text-gray-500'>No article metrics yet.</p>
              ) : (
                <div className='space-y-2'>
                  {stats.top_articles.slice(0, 8).map((a) => (
                    <div key={a.id} className='flex items-center gap-3 text-sm'>
                      <p className='flex-1 truncate text-gray-200'>{a.title}</p>
                      <span className='inline-flex items-center gap-1 text-gray-500'>
                        <Eye size={12} /> {a.views_count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null
      )}

      {tab === 'queue' && (
        queueLoading ? <Spinner /> : queueError ? (
          <ErrorPanel message='Failed to load approval queue.' />
        ) : !queueItems.length ? (
          <div className='text-center py-16 text-gray-500'>
            <CheckCircle size={40} className='mx-auto mb-4 opacity-20' />
            <p>Queue is empty — nothing to review.</p>
          </div>
        ) : (
          <>
            <div className='space-y-3'>
              {queueItems.map((article) => (
                <QueueItem
                  key={article.id}
                  article={article}
                  loadingAction={actionState?.id === article.id ? actionState.action : null}
                  onApprove={() => runQueueAction('approve', article)}
                  onPublish={() => runQueueAction('publish', article)}
                  onReject={() => {
                    setRejectArticle(article)
                    setRejectNote('')
                  }}
                />
              ))}
            </div>

            <PaginationBar
              page={queueMeta?.page ?? queuePage}
              pages={queueMeta?.pages ?? 1}
              total={queueMeta?.total ?? queueItems.length}
              hasMore={queueMeta?.has_more ?? false}
              onPrev={() => setQueuePage((p) => Math.max(1, p - 1))}
              onNext={() => setQueuePage((p) => p + 1)}
            />
          </>
        )
      )}

      {tab === 'users' && isSuperadmin && (
        usersLoading ? <Spinner /> : usersError ? (
          <ErrorPanel message='Failed to load admin users.' />
        ) : (
          <>
            <div className='space-y-2'>
              {userItems.map((u) => (
                <div key={u.id} className='flex items-center gap-4 p-3 rounded-xl bg-gray-900 border border-gray-800'>
                  <Avatar name={u.name} src={u.avatar_url} size='sm' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-white truncate'>{u.name}</p>
                    <p className='text-xs text-gray-500 truncate'>{u.email}</p>
                  </div>
                  <Badge variant={u.is_active ? 'success' : 'danger'}>
                    {u.is_active ? 'Active' : 'Banned'}
                  </Badge>
                  <Badge variant='default'>{u.role}</Badge>
                  {u.is_active ? (
                    <Button size='sm' variant='danger' onClick={() => handleBan(u.id, u.name)}>
                      Ban
                    </Button>
                  ) : (
                    <Button size='sm' variant='secondary' onClick={() => handleUnban(u.id, u.name)}>
                      Unban
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <PaginationBar
              page={usersMeta?.page ?? usersPage}
              pages={usersMeta?.pages ?? 1}
              total={usersMeta?.total ?? userItems.length}
              hasMore={usersMeta?.has_more ?? false}
              onPrev={() => setUsersPage((p) => Math.max(1, p - 1))}
              onNext={() => setUsersPage((p) => p + 1)}
            />
          </>
        )
      )}

      <Modal
        open={!!rejectArticle}
        onClose={() => setRejectArticle(null)}
        title='Reject article'
      >
        <div className='space-y-4'>
          <div className='rounded-lg border border-amber-800/40 bg-amber-900/20 p-3 text-sm text-amber-200 flex gap-2'>
            <AlertTriangle size={15} className='mt-0.5 shrink-0' />
            <div>
              <p className='font-medium'>{rejectArticle?.title}</p>
              <p className='text-amber-300/80'>Provide a clear reason so the author can revise properly.</p>
            </div>
          </div>

          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder='Reason for rejection (required)...'
            rows={4}
            className='w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none resize-none'
          />

          <div className='flex justify-end gap-2'>
            <Button variant='ghost' onClick={() => setRejectArticle(null)}>Cancel</Button>
            <Button
              variant='danger'
              loading={actionState?.action === 'reject' && actionState?.id === rejectArticle?.id}
              disabled={!rejectArticle || !rejectNote.trim()}
              onClick={async () => {
                if (!rejectArticle) return
                await runQueueAction('reject', rejectArticle, rejectNote.trim())
                setRejectArticle(null)
                setRejectNote('')
              }}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function QueueItem({
  article,
  loadingAction,
  onApprove,
  onPublish,
  onReject,
}: {
  article: ArticleDetail
  loadingAction: ModerationAction | null
  onApprove: () => Promise<void>
  onPublish: () => Promise<void>
  onReject: () => void
}) {
  return (
    <div className='p-4 rounded-xl bg-gray-900 border border-gray-800'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <p className='font-medium text-white truncate'>{article.title}</p>
          <p className='text-sm text-gray-500 mt-0.5'>by {article.author_name}</p>
        </div>
        <Badge variant='warning'>{article.status}</Badge>
      </div>

      <div className='flex gap-2 mt-4'>
        <Button size='sm' variant='primary' loading={loadingAction === 'approve'} onClick={onApprove}>
          <CheckCircle size={13} /> Approve
        </Button>
        <Button size='sm' variant='primary' loading={loadingAction === 'publish'} onClick={onPublish}>
          <Radio size={13} /> Publish
        </Button>
        <Button size='sm' variant='danger' onClick={onReject}>
          <XCircle size={13} /> Reject
        </Button>
      </div>
    </div>
  )
}

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className='p-4 rounded-xl bg-gray-900 border border-gray-800'>
      <p className='text-2xl font-bold text-white'>{value}</p>
      <p className='text-xs text-gray-500 mt-1'>{label}</p>
    </div>
  )
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className='rounded-xl border border-red-800/40 bg-red-950/30 px-4 py-5 text-sm text-red-200'>
      {message}
    </div>
  )
}

function ChartCard({
  title,
  icon: Icon,
  items,
}: {
  title: string
  icon: typeof BarChart2
  items: Array<{ label: string; value: number }>
}) {
  const max = Math.max(1, ...items.map((item) => item.value))

  return (
    <div className='rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-4'>
      <div className='flex items-center gap-2 text-gray-300'>
        <Icon size={15} />
        <h2 className='text-sm font-semibold'>{title}</h2>
      </div>

      {items.length === 0 ? (
        <p className='text-sm text-gray-500'>No data available yet.</p>
      ) : (
        <div className='space-y-3'>
          {items.map((item) => (
            <BarRow
              key={item.label}
              label={item.label}
              value={item.value}
              percent={(item.value / max) * 100}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BarRow({ label, value, percent }: { label: string; value: number; percent: number }) {
  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between gap-3 text-xs'>
        <span className='text-gray-400 truncate'>{label}</span>
        <span className='text-white font-medium'>{value}</span>
      </div>
      <div className='h-2 rounded-full bg-gray-800 overflow-hidden'>
        <div
          className='h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300'
          style={{ width: `${Math.max(8, percent)}%` }}
        />
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex items-center justify-between text-sm'>
      <span className='text-gray-400'>{label}</span>
      <span className='text-white font-medium'>{value}</span>
    </div>
  )
}

function PaginationBar({
  page,
  pages,
  total,
  hasMore,
  onPrev,
  onNext,
}: {
  page: number
  pages: number
  total: number
  hasMore: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className='flex items-center justify-between pt-2'>
      <p className='text-xs text-gray-600'>
        Page {page} of {Math.max(1, pages)} • Total {total}
      </p>
      <div className='flex gap-2'>
        <button
          disabled={page <= 1}
          onClick={onPrev}
          className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors'
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          disabled={!hasMore}
          onClick={onNext}
          className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors'
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
