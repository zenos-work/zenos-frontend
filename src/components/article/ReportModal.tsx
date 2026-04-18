import { useState } from 'react'
import Modal from '../ui/Modal'
import { useSubmitReport } from '../../hooks/useReports'
import { useUiStore } from '../../stores/uiStore'

type Props = {
  open: boolean
  onClose: () => void
  articleId: string
}

const reasons = ['spam', 'harassment', 'copyright', 'misinformation', 'other']

export default function ReportModal({ open, onClose, articleId }: Props) {
  const toast = useUiStore((s) => s.toast)
  const submit = useSubmitReport()
  const [reason, setReason] = useState('spam')
  const [detail, setDetail] = useState('')

  const handleSubmit = async () => {
    try {
      await submit.mutateAsync({
        resource_type: 'article',
        resource_id: articleId,
        reason,
        detail_text: detail.trim() || undefined,
      })
      toast('Report submitted', 'success')
      onClose()
      setDetail('')
      setReason('spam')
    } catch {
      toast('Could not submit report', 'error')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title='Report article'>
      <div className='space-y-4'>
        <label className='block'>
          <span className='mb-1 block text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Reason</span>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className='w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)]'
          >
            {reasons.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className='block'>
          <span className='mb-1 block text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]'>Details (optional)</span>
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            rows={4}
            className='w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)]'
            placeholder='Provide any additional context to help moderation.'
          />
        </label>
        <div className='flex justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={() => void handleSubmit()}
            disabled={submit.isPending}
            className='rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'
          >
            {submit.isPending ? 'Submitting...' : 'Submit report'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
