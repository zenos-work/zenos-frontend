import { useState } from 'react'
import Modal from '../ui/Modal'
import Spinner from '../ui/Spinner'
import { useArticleRevision, useArticleRevisions } from '../../hooks/useRevisions'

type Props = {
  articleId: string
  open: boolean
  onClose: () => void
}

export default function RevisionHistoryPanel({ articleId, open, onClose }: Props) {
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(undefined)
  const revisions = useArticleRevisions(articleId, open)
  const revision = useArticleRevision(articleId, selectedVersion, open && selectedVersion !== undefined)

  return (
    <Modal open={open} onClose={onClose} title='Revision history' size='xl'>
      <div className='grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]'>
        <div className='space-y-2'>
          {revisions.isLoading ? (
            <div className='flex justify-center py-8'><Spinner /></div>
          ) : !(revisions.data?.revisions?.length ?? 0) ? (
            <p className='text-sm text-gray-400'>No revisions recorded yet.</p>
          ) : (
            revisions.data?.revisions.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => setSelectedVersion(item.version_number)}
                className={[
                  'w-full rounded-lg border px-3 py-3 text-left transition-colors',
                  selectedVersion === item.version_number
                    ? 'border-[color:var(--accent)] bg-[color:var(--surface-1)]'
                    : 'border-[color:var(--border)] bg-[color:var(--surface-0)] hover:bg-[color:var(--surface-1)]',
                ].join(' ')}
              >
                <p className='text-sm font-semibold text-[color:var(--text-primary)]'>Version {item.version_number}</p>
                <p className='mt-1 text-xs text-[color:var(--text-muted)]'>{new Date(item.created_at).toLocaleString()}</p>
                {item.change_summary && <p className='mt-2 text-xs text-[color:var(--text-secondary)]'>{item.change_summary}</p>}
              </button>
            ))
          )}
        </div>

        <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
          {selectedVersion === undefined ? (
            <p className='text-sm text-[color:var(--text-secondary)]'>Select a version to inspect its snapshot.</p>
          ) : revision.isLoading ? (
            <div className='flex justify-center py-8'><Spinner /></div>
          ) : !revision.data ? (
            <p className='text-sm text-[color:var(--text-secondary)]'>Could not load this revision.</p>
          ) : (
            <div className='space-y-4'>
              <div>
                <p className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>Title</p>
                <h3 className='mt-1 text-lg font-semibold text-[color:var(--text-primary)]'>{revision.data.title}</h3>
                {revision.data.subtitle && <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>{revision.data.subtitle}</p>}
              </div>
              <div className='grid gap-3 md:grid-cols-3'>
                <div>
                  <p className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>Words</p>
                  <p className='mt-1 text-sm text-[color:var(--text-primary)]'>{revision.data.word_count}</p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>Char diff</p>
                  <p className='mt-1 text-sm text-[color:var(--text-primary)]'>{revision.data.char_diff}</p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>Edit type</p>
                  <p className='mt-1 text-sm text-[color:var(--text-primary)]'>{revision.data.edit_type}</p>
                </div>
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>Snapshot</p>
                <pre className='mt-2 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-[color:var(--surface-1)] p-3 text-sm text-[color:var(--text-secondary)]'>
                  {revision.data.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
