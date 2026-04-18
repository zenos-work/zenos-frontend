import { useState } from 'react'
import { CheckCircle2, XCircle, Send, AlertTriangle } from 'lucide-react'
import { useApproveArticle, usePublishArticle, useRejectArticle } from '../../hooks/useAdmin'
import { useUiStore } from '../../stores/uiStore'
import { isAxiosError } from 'axios'
import Button from '../ui/Button'
import SurfaceCard from '../ui/SurfaceCard'
import type { ArticleDetail } from '../../types'

interface ReviewToolbarProps {
  article: ArticleDetail
}

export default function ReviewToolbar({ article }: ReviewToolbarProps) {
  const toast = useUiStore((s) => s.toast)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const approveMutation = useApproveArticle()
  const publishMutation = usePublishArticle()
  const rejectMutation = useRejectArticle()

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

  const onApprove = async () => {
    try {
      await approveMutation.mutateAsync(article.id)
      toast('Article approved successfully', 'success')
    } catch (err) {
      handleActionError('approve', err)
    }
  }

  const onPublish = async () => {
    try {
      await publishMutation.mutateAsync(article.id)
      toast('Article published successfully', 'success')
    } catch (err) {
      handleActionError('publish', err)
    }
  }

  const onReject = async () => {
    if (!rejectNote.trim()) {
      toast('Please provide a reason for rejection', 'error')
      return
    }
    try {
      await rejectMutation.mutateAsync({ articleId: article.id, note: rejectNote.trim() })
      toast('Article rejected', 'success')
      setShowRejectForm(false)
      setRejectNote('')
    } catch (err) {
      handleActionError('reject', err)
    }
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    SUBMITTED: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    APPROVED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
    PUBLISHED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }

  return (
    <div className='sticky top-20 z-30 mb-8'>
      <SurfaceCard className='border-[color:var(--accent)] bg-[color:var(--surface-0)] shadow-2xl overflow-hidden' padding='none'>
        <div className='flex items-center justify-between border-b border-[color:var(--border)] bg-[color:var(--accent-dim)] px-6 py-3'>
          <div className='flex items-center gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--accent)] text-white'>
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className='text-xs font-bold uppercase tracking-wider text-[color:var(--accent)]'>Review Required</p>
              <p className='text-sm font-medium text-[color:var(--text-primary)]'>This article is currently in the review workflow.</p>
            </div>
          </div>
          <div className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${statusColors[article.status] ?? ''}`}>
            {article.status}
          </div>
        </div>

        <div className='p-6'>
          {showRejectForm ? (
            <div className='space-y-4'>
              <div>
                <label className='mb-1.5 block text-xs font-semibold text-[color:var(--text-secondary)]'>Rejection Reason</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder='Explain what needs to be fixed...'
                  className='h-24 w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-1)] p-3 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]'
                />
              </div>
              <div className='flex gap-2'>
                <Button size='sm' variant='primary' className='bg-red-600 hover:bg-red-700' loading={rejectMutation.isPending} onClick={onReject}>
                  Confirm Rejection
                </Button>
                <Button size='sm' variant='secondary' onClick={() => setShowRejectForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className='flex flex-wrap items-center gap-3'>
              {article.status === 'SUBMITTED' && (
                <>
                  <Button size='md' variant='primary' loading={approveMutation.isPending} onClick={onApprove}>
                    <CheckCircle2 size={16} /> Approve Article
                  </Button>
                  <Button size='md' variant='secondary' className='border-red-500/50 text-red-500 hover:bg-red-500/5' onClick={() => setShowRejectForm(true)}>
                    <XCircle size={16} /> Reject
                  </Button>
                </>
              )}

              {article.status === 'APPROVED' && (
                <Button size='md' variant='primary' className='bg-blue-600 hover:bg-blue-700' loading={publishMutation.isPending} onClick={onPublish}>
                  <Send size={16} /> Publish Now
                </Button>
              )}

              {article.status === 'REJECTED' && (
                <div className='text-sm text-[color:var(--text-secondary)]'>
                  Article was rejected. Awaiting author corrections.
                </div>
              )}

              <p className='ml-auto text-xs text-[color:var(--text-muted)]'>
                Actions are recorded in the governance log.
              </p>
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  )
}
