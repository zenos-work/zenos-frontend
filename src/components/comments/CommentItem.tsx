import { useState } from 'react'
import type { Comment } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { useEditComment, useDeleteComment } from '../../hooks/useComments'
import Avatar from '../ui/Avatar'
import CommentForm from './CommentForm'
import Button from '../ui/Button'

interface Props { comment: Comment; articleId: string }

export default function CommentItem({ comment, articleId }: Props) {
  const { user } = useAuth()
  const [editing, setEditing]   = useState(false)
  const [replying, setReplying] = useState(false)
  const [editText, setEditText] = useState(comment.content)

  const editMutation   = useEditComment(comment.id, articleId)
  const deleteMutation = useDeleteComment(articleId)

  const isOwner   = user?.id === comment.author_id
  const isDeleted = !!comment.is_deleted

  const handleSaveEdit = async () => {
    if (!editText.trim()) return
    await editMutation.mutateAsync(editText.trim())
    setEditing(false)
  }

  const wasEdited = comment.updated_at && comment.updated_at !== comment.created_at

  return (
    <div className='flex gap-3'>
      <Avatar name={comment.author_name ?? '?'} src={comment.author_avatar} size='sm' />

      <div className='flex-1 min-w-0 space-y-1'>
        {/* Header */}
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='text-sm font-medium' style={{ color: 'var(--text-primary)' }}>{comment.author_name}</span>
          <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
            {new Date(comment.created_at).toLocaleDateString()}
            {wasEdited && ' · edited'}
          </span>
        </div>

        {/* Body */}
        {editing ? (
          <div className='space-y-2'>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={3}
              className='w-full rounded-lg px-3 py-2 text-sm outline-none resize-none'
              style={{
                backgroundColor: 'var(--surface-1)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            />
            <div className='flex gap-2'>
              <Button size='sm' onClick={handleSaveEdit} loading={editMutation.isPending}>
                Save
              </Button>
              <Button size='sm' variant='ghost' onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className='text-sm' style={{ color: isDeleted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {isDeleted ? '[deleted]' : comment.content}
          </p>
        )}

        {/* Actions */}
        {!isDeleted && !editing && (
          <div className='flex gap-4 pt-1'>
            {user && (
              <button
                onClick={() => setReplying(r => !r)}
                className='text-xs transition-colors'
                style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                Reply
              </button>
            )}
            {isOwner && (
              <>
                <button
                  onClick={() => { setEditText(comment.content); setEditing(true) }}
                  className='text-xs transition-colors'
                  style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate(comment.id)}
                  className='text-xs transition-colors'
                  style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ff6b6b'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply form */}
        {replying && (
          <div className='mt-3'>
            <CommentForm
              articleId={articleId}
              parentId={comment.id}
              onDone={() => setReplying(false)}
              placeholder={`Reply to ${comment.author_name}...`}
            />
          </div>
        )}

        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <div className='mt-4 pl-4 space-y-4' style={{ borderLeft: '1px solid var(--border)' }}>
            {comment.replies.map(r => (
              <CommentItem key={r.id} comment={r} articleId={articleId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
