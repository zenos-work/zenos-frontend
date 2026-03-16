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
          <span className='text-sm font-medium text-white'>{comment.author_name}</span>
          <span className='text-xs text-gray-600'>
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
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-600 resize-none'
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
          <p className={`text-sm ${isDeleted ? 'text-gray-600 italic' : 'text-gray-300'}`}>
            {isDeleted ? '[deleted]' : comment.content}
          </p>
        )}

        {/* Actions */}
        {!isDeleted && !editing && (
          <div className='flex gap-4 pt-1'>
            {user && (
              <button
                onClick={() => setReplying(r => !r)}
                className='text-xs text-gray-500 hover:text-white transition-colors'
              >
                Reply
              </button>
            )}
            {isOwner && (
              <>
                <button
                  onClick={() => { setEditText(comment.content); setEditing(true) }}
                  className='text-xs text-gray-500 hover:text-white transition-colors'
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate(comment.id)}
                  className='text-xs text-gray-500 hover:text-red-400 transition-colors'
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
          <div className='mt-4 pl-4 border-l border-gray-800 space-y-4'>
            {comment.replies.map(r => (
              <CommentItem key={r.id} comment={r} articleId={articleId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
