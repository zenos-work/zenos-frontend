import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import {
  useAdminStats,
  useAdminRanking,
  useAdminRankingWeights,
  useUpdateAdminRankingWeights,
  useAdminSuccessSignalHistory,
  useAdminSuccessSignals,
  useApprovalQueue,
  useBulkQueueAction,
  useModerationComments,
  useModerateComment,
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
import MetricTile from '../components/ui/MetricTile'
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
  Heart,
  MessageCircle,
  Share2,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ArticleDetail, RankingWeights, User, UserRole } from '../types'

type Tab = 'stats' | 'queue' | 'users'
type ModerationAction = 'approve' | 'publish' | 'reject'

const ROLE_OPTIONS: UserRole[] = ['SUPERADMIN', 'APPROVER', 'AUTHOR', 'READER']

export default function AdminPage() {
  const { user } = useAuth()
  const toast = useUiStore((s) => s.toast)
  const qc = useQueryClient()

  const isSuperadmin = user?.role === 'SUPERADMIN'

  const [tab, setTab] = useState<Tab>('queue')
  const [queuePage, setQueuePage] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const [signalsPage, setSignalsPage] = useState(1)
  const [commentsPage, setCommentsPage] = useState(1)
  const [rejectArticle, setRejectArticle] = useState<ArticleDetail | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [bulkRejectNote, setBulkRejectNote] = useState('')
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('READER')
  const [actionState, setActionState] = useState<{
    id: string
    action: ModerationAction
  } | null>(null)
  const [weightForm, setWeightForm] = useState<RankingWeights | null>(null)

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
  const {
    data: successSignals,
    isLoading: signalsLoading,
    isError: signalsError,
  } = useAdminSuccessSignals(signalsPage, 10, isSuperadmin)
  const {
    data: rankingData,
    isLoading: rankingLoading,
    isError: rankingError,
  } = useAdminRanking(8, isSuperadmin)
  const {
    data: rankingWeights,
    isLoading: rankingWeightsLoading,
  } = useAdminRankingWeights(isSuperadmin)
  const {
    data: moderationComments,
    isLoading: moderationCommentsLoading,
    isError: moderationCommentsError,
  } = useModerationComments(commentsPage, 20, true)

  const banMutation = useBanUser()
  const unbanMutation = useUnbanUser()
  const updateWeightsMutation = useUpdateAdminRankingWeights()
  const bulkQueueMutation = useBulkQueueAction()
  const moderateCommentMutation = useModerateComment()

  useEffect(() => {
    if (rankingWeights) setWeightForm(rankingWeights)
  }, [rankingWeights])

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

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      api.put(`/api/users/${userId}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })

  const queueItems = useMemo(() => queue?.queue ?? [], [queue?.queue])
  const queueMeta = queue?.pagination
  const moderationCommentItems = moderationComments?.data ?? []
  const moderationCommentsMeta = moderationComments?.pagination
  const userItems = users?.users ?? []
  const usersMeta = users?.pagination
  const signalItems = successSignals?.snapshots ?? []
  const signalMeta = successSignals?.pagination

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

  const governanceInsights = useMemo(() => {
    const approved = stats?.governance?.recent_activity?.approved_7d ?? 0
    const rejected = stats?.governance?.recent_activity?.rejected_7d ?? 0
    const published = stats?.governance?.recent_activity?.published_7d ?? 0
    const pending = stats?.governance?.moderation?.pending_approvals ?? 0
    const flagged = stats?.governance?.moderation?.flagged_comments ?? 0
    const hidden = stats?.governance?.moderation?.hidden_comments ?? 0

    const reviewTotal = approved + rejected
    const approvalRate = reviewTotal > 0 ? (approved / reviewTotal) * 100 : 0
    const rejectionRate = reviewTotal > 0 ? (rejected / reviewTotal) * 100 : 0
    const publishEfficiency = approved > 0 ? (published / approved) * 100 : 0
    const moderationPressure = stats?.total_comments
      ? ((flagged + hidden) / Math.max(1, stats.total_comments)) * 100
      : 0
    const queuePressure = pending > 0 && reviewTotal > 0 ? pending / reviewTotal : pending > 0 ? pending : 0

    return {
      approvalRate,
      rejectionRate,
      publishEfficiency,
      moderationPressure,
      queuePressure,
      reviewTotal,
      pending,
      flagged,
    }
  }, [stats])

  const riskArticles = useMemo(() => {
    return [...(stats?.top_articles ?? [])]
      .map((article) => ({
        id: article.id,
        title: article.title,
        dislikes: article.dislikes_count ?? 0,
        comments: article.comments_count,
        views: article.views_count,
        riskScore: ((article.dislikes_count ?? 0) * 5) + (article.comments_count * 2),
      }))
      .filter((article) => article.riskScore > 0)
      .sort((left, right) => right.riskScore - left.riskScore)
      .slice(0, 6)
  }, [stats?.top_articles])

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
    } catch (err) {
      if (isAxiosError(err)) {
        const message =
          (err.response?.data && typeof err.response.data.error === 'string' && err.response.data.error) ||
          (err.response?.data && typeof err.response.data.message === 'string' && err.response.data.message) ||
          `Failed to ${action} article`
        toast(message, 'error')
      } else {
        toast(`Failed to ${action} article`, 'error')
      }
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

  const openEditUser = (targetUser: User) => {
    setEditingUser(targetUser)
    setSelectedRole(targetUser.role)
  }

  const saveRole = async () => {
    if (!editingUser) return
    if (editingUser.role === selectedRole) {
      setEditingUser(null)
      return
    }
    try {
      await updateRoleMutation.mutateAsync({
        userId: editingUser.id,
        role: selectedRole,
      })
      toast(`Updated role for ${editingUser.name} to ${selectedRole}`, 'success')
      setEditingUser(null)
    } catch {
      toast('Failed to update role', 'error')
    }
  }

  const saveWeights = async () => {
    if (!weightForm) return
    try {
      await updateWeightsMutation.mutateAsync({
        likes_weight: Number(weightForm.likes_weight),
        shares_weight: Number(weightForm.shares_weight),
        comments_weight: Number(weightForm.comments_weight),
        dislikes_weight: Number(weightForm.dislikes_weight),
        views_weight: Number(weightForm.views_weight),
        recency_weight: Number(weightForm.recency_weight),
      })
      toast('Ranking weights updated', 'success')
    } catch {
      toast('Failed to update ranking weights', 'error')
    }
  }

  useEffect(() => {
    setSelectedArticleIds((prev) => prev.filter((id) => queueItems.some((item) => item.id === id)))
  }, [queueItems])

  const toggleArticleSelection = (articleId: string) => {
    setSelectedArticleIds((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId],
    )
  }

  const selectAllVisible = () => {
    const visibleIds = queueItems.map((item) => item.id)
    setSelectedArticleIds(visibleIds)
  }

  const clearQueueSelection = () => {
    setSelectedArticleIds([])
  }

  const runBulkQueueAction = async (action: ModerationAction) => {
    if (!selectedArticleIds.length) {
      toast('Select at least one article', 'error')
      return
    }
    if (action === 'reject' && !bulkRejectNote.trim()) {
      toast('Reject note is required for bulk reject', 'error')
      return
    }
    try {
      const response = await bulkQueueMutation.mutateAsync({
        action,
        article_ids: selectedArticleIds,
        note: action === 'reject' ? bulkRejectNote.trim() : undefined,
      })
      const failed = response.failed ?? 0
      if (failed > 0) {
        toast(`${response.succeeded} succeeded, ${failed} failed`, 'error')
      } else {
        toast(`Bulk ${action} completed for ${response.succeeded} articles`, 'success')
      }
      setSelectedArticleIds([])
      if (action === 'reject') setBulkRejectNote('')
    } catch {
      toast(`Bulk ${action} failed`, 'error')
    }
  }

  const moderateComment = async (commentId: string, isHidden: boolean) => {
    try {
      await moderateCommentMutation.mutateAsync({
        commentId,
        is_hidden: isHidden,
        reason: isHidden ? 'Hidden by moderation review' : 'Restored by moderation review',
      })
      toast(isHidden ? 'Comment hidden' : 'Comment restored', 'success')
    } catch {
      toast('Failed to moderate comment', 'error')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Shield size={20} className='text-[color:var(--accent)]' />
          <h1 className='text-xl font-bold text-[color:var(--text-primary)]'>Admin</h1>
        </div>
        <Badge variant='warning'>{user?.role}</Badge>
      </div>

      {!isSuperadmin && (
        <div className='rounded-xl border border-[color:rgba(166,124,60,0.32)] bg-[color:rgba(166,124,60,0.14)] px-4 py-3 text-sm text-[color:#8a5b18] dark:text-[#e7bd7a]'>
          <p className='font-medium'>Approver view</p>
          <p className='mt-0.5 text-[color:var(--text-secondary)]'>
            You can manage article approvals. User governance and global stats are SUPERADMIN-only.
          </p>
        </div>
      )}

      <div className='flex gap-1 overflow-x-auto border-b border-[color:var(--border)]'>
        {shownTabs.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === id
                ? 'border-[color:var(--accent)] text-[color:var(--text-primary)]'
                : 'border-transparent text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]',
            ].join(' ')}
          >
            <Icon size={15} />
            {label}
            {badge != null && badge > 0 && (
              <span className='ml-1 rounded-full bg-[color:var(--accent)] px-1.5 py-0.5 text-xs text-white'>
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
            <div className='grid grid-cols-2 sm:grid-cols-5 gap-4'>
              <MetricTile label='Active users' value={stats.total_users.toLocaleString()} />
              <MetricTile label='Comments' value={stats.total_comments.toLocaleString()} />
              <MetricTile label='Shares' value={stats.total_shares.toLocaleString()} />
              <MetricTile label='Pending approvals' value={(stats.governance?.moderation?.pending_approvals ?? 0).toLocaleString()} />
              <MetricTile label='Notifications (7d)' value={(stats.governance?.recent_activity?.notifications_7d ?? 0).toLocaleString()} />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5'>
              <MetricTile
                label='Approval rate'
                value={`${governanceInsights.approvalRate.toFixed(1)}%`}
                tone='positive'
                detail={`${governanceInsights.reviewTotal} reviews in 7d`}
              />
              <MetricTile
                label='Rejection rate'
                value={`${governanceInsights.rejectionRate.toFixed(1)}%`}
                tone='warning'
                detail='Signals editorial quality trend'
              />
              <MetricTile
                label='Publish efficiency'
                value={`${governanceInsights.publishEfficiency.toFixed(1)}%`}
                tone='accent'
                detail='Approved stories reaching publish'
              />
              <MetricTile
                label='Moderation pressure'
                value={`${governanceInsights.moderationPressure.toFixed(1)}%`}
                tone='warning'
                detail={`${governanceInsights.flagged} flagged threads`}
              />
              <MetricTile
                label='Queue pressure'
                value={governanceInsights.queuePressure.toFixed(2)}
                tone='accent'
                detail={`${governanceInsights.pending} pending approvals`}
              />
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
              {stats.articles_by_status.map((row) => (
                <MetricTile key={row.status} label={row.status} value={row.c.toLocaleString()} />
              ))}
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
              <ChartCard title='Article status distribution' icon={BarChart2} items={statusChart} />
              <ChartCard title='Users by role' icon={Users} items={roleChart} />
              <ChartCard title='Governance activity (7d)' icon={Activity} items={activityChart} />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              <div className='space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
                <div className='flex items-center gap-2 text-[color:var(--text-primary)]'>
                  <Users size={15} />
                  <h2 className='text-sm font-semibold'>Users by role</h2>
                </div>
                <div className='space-y-2'>
                  {(stats.governance?.users_by_role ?? []).map((row) => (
                    <StatRow key={row.role} label={row.role} value={row.c} />
                  ))}
                </div>
              </div>

              <div className='space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
                <div className='flex items-center gap-2 text-[color:var(--text-primary)]'>
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

            <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
              <h2 className='mb-3 text-sm font-semibold text-[color:var(--text-primary)]'>Top articles</h2>
              {stats.top_articles.length === 0 ? (
                <p className='text-sm text-[color:var(--text-secondary)]'>No article metrics yet.</p>
              ) : (
                <div className='space-y-2'>
                  {stats.top_articles.slice(0, 8).map((a) => (
                    <div key={a.id} className='flex items-center gap-3 text-sm'>
                      <p className='flex-1 truncate text-[color:var(--text-primary)]'>{a.title}</p>
                      <span className='inline-flex items-center gap-1 text-[color:var(--text-muted)]'>
                        <Eye size={12} /> {a.views_count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
              <div className='mb-3 flex items-center justify-between gap-2'>
                <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Risk watchlist</h2>
                <Badge variant='warning'>Dislikes + comments weighted</Badge>
              </div>
              {riskArticles.length === 0 ? (
                <p className='text-sm text-[color:var(--text-secondary)]'>No elevated risk stories detected from current metrics.</p>
              ) : (
                <div className='space-y-2'>
                  {riskArticles.map((article) => (
                    <div key={article.id} className='grid grid-cols-[minmax(0,1fr)_70px_70px_70px] items-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm'>
                      <p className='truncate font-medium text-[color:var(--text-primary)]'>{article.title}</p>
                      <span className='text-xs text-[color:var(--text-secondary)]'>Views {article.views}</span>
                      <span className='text-xs text-[color:var(--text-secondary)]'>Comments {article.comments}</span>
                      <span className='text-xs font-semibold text-[color:#b42318]'>Risk {article.riskScore}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='space-y-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
              <div className='flex items-center justify-between gap-3'>
                <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Engagement ranking (weighted)</h2>
                <Badge variant='default'>SUPERADMIN controls</Badge>
              </div>

              {rankingWeightsLoading ? (
                <Spinner />
              ) : weightForm ? (
                <>
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                    <WeightField label='Likes' value={weightForm.likes_weight} onChange={(v) => setWeightForm((prev) => prev ? { ...prev, likes_weight: v } : prev)} />
                    <WeightField label='Shares' value={weightForm.shares_weight} onChange={(v) => setWeightForm((prev) => prev ? { ...prev, shares_weight: v } : prev)} />
                    <WeightField label='Comments' value={weightForm.comments_weight} onChange={(v) => setWeightForm((prev) => prev ? { ...prev, comments_weight: v } : prev)} />
                    <WeightField label='Dislikes' value={weightForm.dislikes_weight} onChange={(v) => setWeightForm((prev) => prev ? { ...prev, dislikes_weight: v } : prev)} />
                    <WeightField label='Views' value={weightForm.views_weight} onChange={(v) => setWeightForm((prev) => prev ? { ...prev, views_weight: v } : prev)} />
                    <WeightField label='Recency' value={weightForm.recency_weight} onChange={(v) => setWeightForm((prev) => prev ? { ...prev, recency_weight: v } : prev)} />
                  </div>
                  <div className='flex justify-end'>
                    <Button size='sm' variant='primary' loading={updateWeightsMutation.isPending} onClick={saveWeights}>
                      Save weights
                    </Button>
                  </div>
                </>
              ) : null}

              {rankingLoading ? (
                <Spinner />
              ) : rankingError ? (
                <ErrorPanel message='Failed to load weighted rankings.' />
              ) : (
                <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
                  <div className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                    <h3 className='mb-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]'>By article type</h3>
                    <div className='space-y-2'>
                      {(rankingData?.content_type_rankings ?? []).map((row) => (
                        <RankingRow
                          key={row.content_type}
                          label={row.content_type}
                          score={row.avg_score}
                          likes={row.likes_count}
                          dislikes={row.dislikes_count}
                          shares={row.shares_count}
                          comments={row.comments_count}
                        />
                      ))}
                    </div>
                  </div>
                  <div className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                    <h3 className='mb-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]'>Top categories</h3>
                    <div className='space-y-2'>
                      {(rankingData?.top_category_rankings ?? []).map((row) => (
                        <RankingRow
                          key={row.category_slug}
                          label={row.category_name || row.category_slug}
                          score={row.avg_score}
                          likes={row.likes_count}
                          dislikes={row.dislikes_count}
                          shares={row.shares_count}
                          comments={row.comments_count}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
              <div className='mb-3 flex items-center justify-between gap-3'>
                <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Success signals (SR-011)</h2>
                <Badge variant='default'>Hourly snapshots</Badge>
              </div>

              {signalsLoading ? (
                <Spinner />
              ) : signalsError ? (
                <ErrorPanel message='Failed to load success signal snapshots.' />
              ) : signalItems.length === 0 ? (
                <p className='text-sm text-[color:var(--text-secondary)]'>No hourly snapshots yet.</p>
              ) : (
                <>
                  <div className='space-y-2'>
                    {signalItems.map((snapshot) => (
                      <div
                        key={`${snapshot.article_id}-${snapshot.bucket_hour}`}
                        className='grid grid-cols-1 gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm md:grid-cols-[minmax(0,1fr)_130px_100px_90px_90px] md:items-center'
                      >
                        <div className='min-w-0'>
                          <p className='truncate font-medium text-[color:var(--text-primary)]'>{snapshot.title}</p>
                          <p className='truncate text-xs text-[color:var(--text-secondary)]'>
                            Hour: {snapshot.bucket_hour} • v:{snapshot.views_count} l:{snapshot.likes_count} c:{snapshot.comments_count}
                          </p>
                        </div>
                        <SuccessRateSparkline articleId={snapshot.article_id} />
                        <p className='text-xs text-[color:var(--text-secondary)]'>
                          Score <span className='font-medium text-[color:var(--text-primary)]'>{snapshot.engagement_score}</span>
                        </p>
                        <p className='text-xs text-[color:var(--text-secondary)]'>
                          Success <span className='font-medium text-[color:var(--text-primary)]'>{snapshot.success_rate}%</span>
                        </p>
                        <a
                          href={`/article/${snapshot.slug}`}
                          className='text-xs font-medium text-[color:var(--accent)] hover:underline'
                        >
                          Open article
                        </a>
                      </div>
                    ))}
                  </div>

                  <PaginationBar
                    page={signalMeta?.page ?? signalsPage}
                    pages={signalMeta?.pages ?? 1}
                    total={signalMeta?.total ?? signalItems.length}
                    hasMore={signalMeta?.has_more ?? false}
                    onPrev={() => setSignalsPage((p) => Math.max(1, p - 1))}
                    onNext={() => setSignalsPage((p) => p + 1)}
                  />
                </>
              )}
            </div>
          </div>
        ) : null
      )}

      {tab === 'queue' && (
        queueLoading ? <Spinner /> : queueError ? (
          <ErrorPanel message='Failed to load approval queue.' />
        ) : !queueItems.length ? (
          <div className='py-16 text-center text-[color:var(--text-secondary)]'>
            <CheckCircle size={40} className='mx-auto mb-4 opacity-20' />
            <p>Queue is empty — nothing to review.</p>
          </div>
        ) : (
          <>
            <div className='space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Bulk queue actions</h2>
                <p className='text-xs text-[color:var(--text-secondary)]'>
                  Selected {selectedArticleIds.length} of {queueItems.length} visible articles
                </p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button size='sm' variant='secondary' onClick={selectAllVisible}>Select all visible</Button>
                <Button size='sm' variant='ghost' onClick={clearQueueSelection}>Clear</Button>
                <Button
                  size='sm'
                  variant='primary'
                  loading={bulkQueueMutation.isPending}
                  disabled={!selectedArticleIds.length}
                  onClick={() => runBulkQueueAction('approve')}
                >
                  Bulk approve
                </Button>
                <Button
                  size='sm'
                  variant='primary'
                  loading={bulkQueueMutation.isPending}
                  disabled={!selectedArticleIds.length}
                  onClick={() => runBulkQueueAction('publish')}
                >
                  Bulk publish
                </Button>
              </div>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <input
                  value={bulkRejectNote}
                  onChange={(e) => setBulkRejectNote(e.target.value)}
                  placeholder='Bulk reject note (required for reject)'
                  className='w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)]'
                />
                <Button
                  size='sm'
                  variant='danger'
                  loading={bulkQueueMutation.isPending}
                  disabled={!selectedArticleIds.length || !bulkRejectNote.trim()}
                  onClick={() => runBulkQueueAction('reject')}
                >
                  Bulk reject
                </Button>
              </div>
            </div>

            <div className='space-y-3'>
              {queueItems.map((article) => (
                <QueueItem
                  key={article.id}
                  article={article}
                  selected={selectedArticleIds.includes(article.id)}
                  onToggleSelected={() => toggleArticleSelection(article.id)}
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

            <div className='space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
              <div className='flex items-center justify-between gap-3'>
                <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Comment moderation</h2>
                <Badge variant='default'>Approver tools</Badge>
              </div>
              {moderationCommentsLoading ? (
                <Spinner />
              ) : moderationCommentsError ? (
                <ErrorPanel message='Failed to load moderation comments.' />
              ) : moderationCommentItems.length === 0 ? (
                <p className='text-sm text-[color:var(--text-secondary)]'>No comments queued for moderation.</p>
              ) : (
                <>
                  <div className='space-y-2'>
                    {moderationCommentItems.map((comment) => {
                      const hidden = Number(comment.is_hidden ?? 0) === 1
                      const flagged = Number(comment.flag_count ?? 0) > 0
                      return (
                        <div key={comment.id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                          <div className='flex flex-wrap items-center gap-2 text-xs'>
                            <Badge variant={hidden ? 'danger' : 'default'}>{hidden ? 'Hidden' : 'Visible'}</Badge>
                            {flagged && <Badge variant='warning'>Flagged x{comment.flag_count}</Badge>}
                            <span className='text-[color:var(--text-secondary)]'>Author: {comment.author_name ?? comment.author_id}</span>
                          </div>
                          <p className='mt-2 text-sm text-[color:var(--text-primary)]'>{comment.content}</p>
                          {comment.moderation_reason && (
                            <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>Reason: {comment.moderation_reason}</p>
                          )}
                          <div className='mt-3 flex gap-2'>
                            {hidden ? (
                              <Button
                                size='sm'
                                variant='secondary'
                                loading={moderateCommentMutation.isPending}
                                onClick={() => moderateComment(comment.id, false)}
                              >
                                Unhide
                              </Button>
                            ) : (
                              <Button
                                size='sm'
                                variant='danger'
                                loading={moderateCommentMutation.isPending}
                                onClick={() => moderateComment(comment.id, true)}
                              >
                                Hide
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <PaginationBar
                    page={moderationCommentsMeta?.page ?? commentsPage}
                    pages={moderationCommentsMeta?.pages ?? 1}
                    total={moderationCommentsMeta?.total ?? moderationCommentItems.length}
                    hasMore={moderationCommentsMeta?.has_more ?? false}
                    onPrev={() => setCommentsPage((p) => Math.max(1, p - 1))}
                    onNext={() => setCommentsPage((p) => p + 1)}
                  />
                </>
              )}
            </div>
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
                <div key={u.id} className='flex items-center gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-3 shadow-sm'>
                  <Avatar name={u.name} src={u.avatar_url} size='sm' />
                  <div className='flex-1 min-w-0'>
                    <p className='truncate text-sm font-medium text-[color:var(--text-primary)]'>{u.name}</p>
                    <p className='truncate text-xs text-[color:var(--text-secondary)]'>{u.email}</p>
                  </div>
                  <Badge variant={u.is_active ? 'success' : 'danger'}>
                    {u.is_active ? 'Active' : 'Banned'}
                  </Badge>
                  <Badge variant='default'>{u.role}</Badge>
                  <Button size='sm' variant='secondary' onClick={() => openEditUser(u)}>
                    Edit
                  </Button>
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
            className='w-full resize-none rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-4 py-3 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none'
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

      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title='Edit user'
      >
        <div className='space-y-4'>
          <div className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-2'>
            <p className='text-sm font-medium text-[color:var(--text-primary)]'>{editingUser?.name}</p>
            <p className='text-xs text-[color:var(--text-secondary)]'>{editingUser?.email}</p>
          </div>

          <div className='space-y-1'>
            <label htmlFor='role-select' className='text-sm font-medium text-[color:var(--text-primary)]'>Role</label>
            <select
              id='role-select'
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className='w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]'
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className='flex justify-end gap-2'>
            <Button variant='ghost' onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button
              variant='primary'
              loading={updateRoleMutation.isPending}
              disabled={!editingUser || selectedRole === editingUser.role}
              onClick={saveRole}
            >
              Save Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function WeightField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className='space-y-1'>
      <span className='text-xs text-[color:var(--text-secondary)]'>{label} weight</span>
      <input
        type='number'
        step='0.1'
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className='w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]'
      />
    </label>
  )
}

function RankingRow({
  label,
  score,
  likes,
  dislikes,
  shares,
  comments,
}: {
  label: string
  score: number
  likes: number
  dislikes: number
  shares: number
  comments: number
}) {
  return (
    <div className='rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-2'>
      <div className='flex items-center justify-between gap-3'>
        <p className='truncate text-sm font-medium text-[color:var(--text-primary)]'>{label}</p>
        <p className='text-xs font-semibold text-[color:var(--accent)]'>Score {score.toFixed(2)}</p>
      </div>
      <div className='mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[color:var(--text-secondary)]'>
        <span className='inline-flex items-center gap-1'><Heart size={11} /> {likes}</span>
        <span className='inline-flex items-center gap-1'><ThumbsDown size={11} /> {dislikes}</span>
        <span className='inline-flex items-center gap-1'><Share2 size={11} /> {shares}</span>
        <span className='inline-flex items-center gap-1'><MessageCircle size={11} /> {comments}</span>
      </div>
    </div>
  )
}

function QueueItem({
  article,
  selected,
  onToggleSelected,
  loadingAction,
  onApprove,
  onPublish,
  onReject,
}: {
  article: ArticleDetail
  selected: boolean
  onToggleSelected: () => void
  loadingAction: ModerationAction | null
  onApprove: () => Promise<void>
  onPublish: () => Promise<void>
  onReject: () => void
}) {
  const canApprove = article.status === 'SUBMITTED'
  const canPublish = article.status === 'APPROVED'
  const canReject = article.status === 'SUBMITTED'

  return (
    <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 flex items-start gap-2'>
          <input
            type='checkbox'
            checked={selected}
            onChange={onToggleSelected}
            className='mt-1 h-4 w-4 rounded border-[color:var(--border-strong)] bg-[color:var(--surface-0)]'
          />
          <div>
          <p className='truncate font-medium text-[color:var(--text-primary)]'>{article.title}</p>
          <p className='mt-0.5 text-sm text-[color:var(--text-secondary)]'>by {article.author_name}</p>
          {(article.moderation_state || article.moderation_note) && (
            <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>
              Workflow: {article.moderation_state ?? 'n/a'}
              {article.moderation_note ? ` • ${article.moderation_note}` : ''}
            </p>
          )}
          </div>
        </div>
        <Badge variant='warning'>{article.status}</Badge>
      </div>

      <div className='flex gap-2 mt-4'>
        <Button
          size='sm'
          variant='primary'
          loading={loadingAction === 'approve'}
          onClick={onApprove}
          disabled={!canApprove}
          title={canApprove ? 'Approve article' : 'Only SUBMITTED articles can be approved'}
        >
          <CheckCircle size={13} /> Approve
        </Button>
        <Button
          size='sm'
          variant='primary'
          loading={loadingAction === 'publish'}
          onClick={onPublish}
          disabled={!canPublish}
          title={canPublish ? 'Publish article' : 'Only APPROVED articles can be published'}
        >
          <Radio size={13} /> Publish
        </Button>
        <Button
          size='sm'
          variant='danger'
          onClick={onReject}
          disabled={!canReject}
          title={canReject ? 'Reject article' : 'Only SUBMITTED articles can be rejected'}
        >
          <XCircle size={13} /> Reject
        </Button>
      </div>
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
  return (
    <div className='space-y-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
      <div className='flex items-center gap-2 text-[color:var(--text-primary)]'>
        <Icon size={15} />
        <h2 className='text-sm font-semibold'>{title}</h2>
      </div>

      {items.length === 0 ? (
        <p className='text-sm text-[color:var(--text-secondary)]'>No data available yet.</p>
      ) : (
        <div className='h-56'>
          <ResponsiveContainer width='100%' height='100%' minWidth={0} minHeight={220}>
            <BarChart data={items} layout='vertical' margin={{ left: 6, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis type='number' allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis type='category' dataKey='label' width={92} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10 }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey='value' fill='var(--accent)' radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex items-center justify-between text-sm'>
      <span className='text-[color:var(--text-secondary)]'>{label}</span>
      <span className='font-medium text-[color:var(--text-primary)]'>{value}</span>
    </div>
  )
}

function SuccessRateSparkline({ articleId }: { articleId: string }) {
  const { data } = useAdminSuccessSignalHistory(articleId, 12, true)
  const points = data?.points ?? []

  if (points.length < 2) {
    return <p className='text-xs text-[color:var(--text-muted)]'>Trend n/a</p>
  }

  return (
    <div className='space-y-1'>
      <div className='h-8 w-[92px]'>
        <ResponsiveContainer width={92} height={32}>
          <LineChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <Tooltip
              cursor={false}
              contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8 }}
              labelStyle={{ color: 'var(--text-primary)' }}
            />
            <Line
              type='monotone'
              dataKey='success_rate'
              stroke='var(--accent)'
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className='text-[10px] leading-none text-[color:var(--text-muted)]'>12h trend</p>
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
      <p className='text-xs text-[color:var(--text-secondary)]'>
        Page {page} of {Math.max(1, pages)} • Total {total}
      </p>
      <div className='flex gap-2'>
        <button
          disabled={page <= 1}
          onClick={onPrev}
          className='inline-flex items-center gap-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-1.5 text-sm text-[color:var(--text-primary)] transition-colors hover:bg-[color:var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40'
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          disabled={!hasMore}
          onClick={onNext}
          className='inline-flex items-center gap-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-1.5 text-sm text-[color:var(--text-primary)] transition-colors hover:bg-[color:var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40'
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
