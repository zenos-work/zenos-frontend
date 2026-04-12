import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  MessageCircle,
  Send,
  XCircle,
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useApprovalQueue, useNotifications } from '../hooks/useAdmin'
import { useMyArticles } from '../hooks/useArticles'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useUiStore } from '../stores/uiStore'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import SurfaceCard from '../components/ui/SurfaceCard'
import SectionHeader from '../components/ui/SectionHeader'
import WorkflowBuilder from '../components/workflow/WorkflowBuilder'
import WorkflowTemplateGallery from '../components/workflow/WorkflowTemplateGallery'
import WorkflowTaskInbox from '../components/workflow/WorkflowTaskInbox'
import WorkflowCostPanel from '../components/workflow/WorkflowCostPanel'
import type { ArticleDetail, ArticleList, Notification } from '../types'

type WorkflowArticle = ArticleDetail | ArticleList
type WorkflowStepStatus = 'completed' | 'in_progress' | 'pending' | 'rejected'
type WorkflowTab = 'approval' | 'builder' | 'templates' | 'tasks' | 'costs'

type WorkflowStep = {
  id: string
  label: string
  status: WorkflowStepStatus
  actor: string | null
  detail: string | null
}

const isReviewerRole = (role?: string | null) => role === 'APPROVER' || role === 'SUPERADMIN'

const humanizeStatus = (status?: string) => (status ?? '').replace(/_/g, ' ').toLowerCase()

const formatDateTime = (value?: string) => {
  if (!value) return 'n/a'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const buildWorkflowSteps = (article: WorkflowArticle, canReview: boolean): WorkflowStep[] => {
  const status = article.status
  const author = article.author_name ?? 'Author'
  const reviewState = article.moderation_state ?? null
  const reviewNote = article.moderation_note ?? null

  const submittedAt = formatDateTime(article.updated_at ?? article.created_at)
  const publishedAt = formatDateTime(article.published_at)

  const submittedDone = ['SUBMITTED', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'].includes(status)
  const reviewDone = ['APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'].includes(status)
  const isRejected = status === 'REJECTED'
  const isPublished = status === 'PUBLISHED'

  return [
    {
      id: 'draft',
      label: 'Draft prepared',
      status: status === 'DRAFT' ? 'in_progress' : 'completed',
      actor: author,
      detail: formatDateTime(article.created_at),
    },
    {
      id: 'submitted',
      label: 'Submitted for review',
      status: submittedDone ? 'completed' : 'pending',
      actor: submittedDone ? author : null,
      detail: submittedDone ? submittedAt : null,
    },
    {
      id: 'review',
      label: canReview ? 'Editorial review' : 'Approver review',
      status: isRejected ? 'rejected' : reviewDone ? 'completed' : status === 'SUBMITTED' ? 'in_progress' : 'pending',
      actor: reviewDone || status === 'SUBMITTED' ? 'Approver' : null,
      detail: reviewState || reviewNote,
    },
    {
      id: 'publish',
      label: 'Published',
      status: isPublished ? 'completed' : 'pending',
      actor: isPublished ? 'System' : null,
      detail: isPublished ? publishedAt : null,
    },
  ]
}

function StepIcon({ status }: { status: WorkflowStepStatus }) {
  if (status === 'completed') return <CheckCircle2 size={16} className='text-[color:#0e9f6e]' />
  if (status === 'in_progress') return <Clock3 size={16} className='text-[color:#b45309]' />
  if (status === 'rejected') return <XCircle size={16} className='text-[color:#dc2626]' />
  return <span className='inline-flex h-4 w-4 rounded-full border border-[color:var(--border-strong)]' />
}

export default function WorkflowPage() {
  const { user } = useAuth()
  const toast = useUiStore((s) => s.toast)
  const qc = useQueryClient()
  const { enabled: workflowBuilderEnabled } = useFeatureFlag('workflow_builder')
  const { enabled: workflowCostsEnabled } = useFeatureFlag('workflow_costs')
  const [activeTab, setActiveTab] = useState<WorkflowTab>('approval')

  const canReview = isReviewerRole(user?.role)

  const {
    data: queueData,
    isLoading: queueLoading,
    isError: queueError,
  } = useApprovalQueue(1, canReview)

  const {
    data: mineData,
    isLoading: mineLoading,
    isError: mineError,
  } = useMyArticles()

  const {
    data: notificationsData,
    isLoading: notificationsLoading,
  } = useNotifications()

  const workflowItems = useMemo<WorkflowArticle[]>(() => {
    if (canReview) {
      return queueData?.queue ?? []
    }
    return (mineData?.items ?? []).filter((item) => item.status !== 'ARCHIVED')
  }, [canReview, mineData?.items, queueData?.queue])

  const [selectedArticleId, setSelectedArticleId] = useState<string>('')
  const [rejectNote, setRejectNote] = useState('')
  const [messageInput, setMessageInput] = useState('')

  const selected = useMemo(
    () => {
      if (!workflowItems.length) return null
      return workflowItems.find((item) => item.id === selectedArticleId) ?? workflowItems[0]
    },
    [selectedArticleId, workflowItems],
  )

  const articleMessages = useMemo(() => {
    if (!selected) return [] as Notification[]
    const notifications = notificationsData?.notifications ?? []
    return notifications
      .filter((n) => n.article_id === selected.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [notificationsData?.notifications, selected])

  const steps = useMemo(() => {
    if (!selected) return [] as WorkflowStep[]
    return buildWorkflowSteps(selected, canReview)
  }, [canReview, selected])

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

  const sendMessageMutation = useMutation({
    mutationFn: ({ articleId, message }: { articleId: string; message: string }) =>
      api.post('/api/users/approvers/message', {
        article_id: articleId,
        mode: 'group',
        message,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const handleActionError = (action: string, err: unknown) => {
    if (isAxiosError(err)) {
      const message =
        (err.response?.data && typeof err.response.data.error === 'string' && err.response.data.error) ||
        (err.response?.data && typeof err.response.data.message === 'string' && err.response.data.message) ||
        `Failed to ${action} article`
      toast(message, 'error')
      return
    }
    toast(`Failed to ${action} article`, 'error')
  }

  const runApprove = async () => {
    if (!selected) return
    try {
      await approveMutation.mutateAsync(selected.id)
      toast(`Approved: ${selected.title}`, 'success')
    } catch (err) {
      handleActionError('approve', err)
    }
  }

  const runPublish = async () => {
    if (!selected) return
    try {
      await publishMutation.mutateAsync(selected.id)
      toast(`Published: ${selected.title}`, 'success')
    } catch (err) {
      handleActionError('publish', err)
    }
  }

  const runReject = async () => {
    if (!selected || !rejectNote.trim()) {
      toast('Reject note is required', 'error')
      return
    }
    try {
      await rejectMutation.mutateAsync({ articleId: selected.id, note: rejectNote.trim() })
      toast(`Rejected: ${selected.title}`, 'success')
      setRejectNote('')
    } catch (err) {
      handleActionError('reject', err)
    }
  }

  const sendMessage = async () => {
    if (!selected || !messageInput.trim()) return
    try {
      await sendMessageMutation.mutateAsync({ articleId: selected.id, message: messageInput.trim() })
      toast('Workflow message sent to approvers', 'success')
      setMessageInput('')
    } catch (err) {
      const fallback = isAxiosError(err) ? err.response?.data?.message : null
      toast(typeof fallback === 'string' ? fallback : 'Could not send workflow message', 'error')
    }
  }

  const loading = canReview ? queueLoading : mineLoading
  const hasError = canReview ? queueError : mineError

  if (activeTab === 'approval' && loading) {
    return <Spinner />
  }

  if (activeTab === 'approval' && hasError) {
    return (
      <SurfaceCard className='border-red-900/35 bg-red-950/25 text-sm text-red-200' padding='md'>
        Failed to load workflow items.
      </SurfaceCard>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <FileText size={20} className='text-[color:var(--accent)]' />
        <div>
          <h1 className='text-xl font-bold text-[color:var(--text-primary)]'>Workflow</h1>
          <p className='text-sm text-[color:var(--text-secondary)]'>Track submissions, approvals, and editorial hand-offs.</p>
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          onClick={() => setActiveTab('approval')}
          className={[
            'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'approval'
              ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
              : 'border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]',
          ].join(' ')}
        >
          Approval Queue
        </button>

        {workflowBuilderEnabled && (
          <>
            <button
              type='button'
              onClick={() => setActiveTab('builder')}
              className={[
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'builder'
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                  : 'border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]',
              ].join(' ')}
            >
              My Workflows
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('templates')}
              className={[
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'templates'
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                  : 'border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]',
              ].join(' ')}
            >
              Templates
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('tasks')}
              className={[
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                activeTab === 'tasks'
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                  : 'border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]',
              ].join(' ')}
            >
              Task Inbox
            </button>
          </>
        )}

        {workflowCostsEnabled && (
          <button
            type='button'
            onClick={() => setActiveTab('costs')}
            className={[
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'costs'
                ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
                : 'border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]',
            ].join(' ')}
          >
            Costs
          </button>
        )}
      </div>

      {activeTab === 'builder' && workflowBuilderEnabled && (
        <WorkflowBuilder />
      )}

      {activeTab === 'templates' && workflowBuilderEnabled && (
        <WorkflowTemplateGallery />
      )}

      {activeTab === 'tasks' && workflowBuilderEnabled && (
        <WorkflowTaskInbox />
      )}

      {activeTab === 'costs' && workflowCostsEnabled && (
        <WorkflowCostPanel orgId='' enabled={workflowCostsEnabled} />
      )}

      {activeTab === 'approval' && !workflowItems.length && (
        <SurfaceCard className='py-10 text-center' padding='md'>
          <CheckCircle2 size={32} className='mx-auto text-[color:#0e9f6e]' />
          <p className='mt-3 text-sm font-medium text-[color:var(--text-primary)]'>No workflow items right now.</p>
          <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>
            {canReview ? 'All review tasks are cleared for now.' : 'Submit a draft to start the editorial workflow.'}
          </p>
        </SurfaceCard>
      )}

      {activeTab === 'approval' && workflowItems.length > 0 && (
      <div className='grid gap-4 lg:grid-cols-[320px_1fr]'>
        <aside className='space-y-2'>
          {workflowItems.map((article) => {
            const selectedCard = article.id === selectedArticleId
            return (
              <button
                key={article.id}
                onClick={() => setSelectedArticleId(article.id)}
                className={[
                  'w-full rounded-xl border p-3 text-left transition-colors',
                  selectedCard
                    ? 'border-[color:var(--accent)] bg-[color:var(--surface-1)]'
                    : 'border-[color:var(--border)] bg-[color:var(--surface-0)] hover:border-[color:var(--border-strong)]',
                ].join(' ')}
              >
                <div className='mb-1 flex items-center justify-between gap-2'>
                  <Badge variant={article.status === 'REJECTED' ? 'danger' : article.status === 'PUBLISHED' ? 'success' : 'warning'}>
                    {humanizeStatus(article.status)}
                  </Badge>
                  <span className='text-xs text-[color:var(--text-muted)]'>{formatDateTime(article.updated_at ?? article.created_at)}</span>
                </div>
                <p className='truncate text-sm font-semibold text-[color:var(--text-primary)]'>{article.title}</p>
                <p className='mt-1 truncate text-xs text-[color:var(--text-secondary)]'>
                  {article.author_name ? `By ${article.author_name}` : 'Author pending'}
                </p>
              </button>
            )
          })}
        </aside>

        {selected && (
          <section className='space-y-4'>
            <SurfaceCard>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <h2 className='truncate text-lg font-semibold text-[color:var(--text-primary)]'>{selected.title}</h2>
                  <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>{selected.subtitle || 'No subtitle provided.'}</p>
                  <div className='mt-3 flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-muted)]'>
                    <span>{selected.read_time_minutes} min read</span>
                    <span>{selected.views_count} views</span>
                    <span>{selected.comments_count} comments</span>
                    <span>{selected.likes_count} likes</span>
                  </div>
                </div>
                <a
                  href={`/article/${selected.slug}`}
                  className='inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
                >
                  <Eye size={13} />
                  Preview
                </a>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader title='Workflow progress' className='mb-3' />
              <div className='space-y-3'>
                {steps.map((step) => (
                  <div key={step.id} className='flex items-start gap-3'>
                    <div className='mt-0.5'><StepIcon status={step.status} /></div>
                    <div className='min-w-0'>
                      <p className='text-sm font-medium text-[color:var(--text-primary)]'>{step.label}</p>
                      {(step.actor || step.detail) && (
                        <p className='mt-0.5 text-xs text-[color:var(--text-secondary)]'>
                          {step.actor ? `${step.actor} • ` : ''}
                          {step.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {canReview && (
                <div className='mt-4 space-y-3 border-t border-[color:var(--border)] pt-4'>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      size='sm'
                      variant='primary'
                      loading={approveMutation.isPending}
                      onClick={runApprove}
                      disabled={selected.status !== 'SUBMITTED'}
                    >
                      <CheckCircle2 size={13} /> Approve
                    </Button>
                    <Button
                      size='sm'
                      variant='primary'
                      loading={publishMutation.isPending}
                      onClick={runPublish}
                      disabled={selected.status !== 'APPROVED'}
                    >
                      <Send size={13} /> Publish
                    </Button>
                    <Button
                      size='sm'
                      variant='danger'
                      loading={rejectMutation.isPending}
                      onClick={runReject}
                      disabled={selected.status !== 'SUBMITTED' || !rejectNote.trim()}
                    >
                      <XCircle size={13} /> Reject
                    </Button>
                  </div>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder='Rejection note (required for reject)'
                    rows={3}
                    className='w-full resize-none rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)]'
                  />
                </div>
              )}
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeader
                title={`Workflow messages (${articleMessages.length})`}
                icon={<MessageCircle size={14} className='text-[color:var(--accent)]' />}
                className='mb-3'
              />

              {notificationsLoading ? (
                <Spinner />
              ) : articleMessages.length === 0 ? (
                <p className='text-sm text-[color:var(--text-secondary)]'>No workflow messages yet.</p>
              ) : (
                <div className='space-y-3'>
                  {articleMessages.map((msg) => (
                    <div key={msg.id} className='flex items-start gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                      <Avatar name={msg.type} size='sm' />
                      <div className='min-w-0'>
                        <p className='text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]'>{msg.type}</p>
                        <p className='mt-1 text-sm text-[color:var(--text-primary)]'>{msg.message}</p>
                        <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>{formatDateTime(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className='mt-4 flex gap-2'>
                <input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder='Message approvers about this workflow item...'
                  className='flex-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)]'
                />
                <Button size='sm' loading={sendMessageMutation.isPending} onClick={sendMessage} disabled={!messageInput.trim()}>
                  <Send size={13} />
                  Send
                </Button>
              </div>
            </SurfaceCard>
          </section>
        )}
      </div>
      )}
    </div>
  )
}
