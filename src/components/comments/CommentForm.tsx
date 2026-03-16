import { useState } from 'react'
import { usePostComment } from '../../hooks/useComments'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

interface Props {
  articleId: string
  parentId?: string
  onDone?:   () => void
  placeholder?: string
}

export default function CommentForm({ articleId, parentId, onDone, placeholder }: Props) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const mutation = usePostComment(articleId)

  if (!user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await mutation.mutateAsync({ content: text.trim(), parent_id: parentId })
    setText('')
    onDone?.()
  }

  return (
    <form onSubmit={handleSubmit} className='flex gap-3'>
      <Avatar name={user.name} src={user.avatar_url} size='sm' />
      <div className='flex-1 space-y-2'>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={placeholder ?? 'Write a comment...'}
          rows={3}
          className='w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-gray-600 resize-none transition-colors'
        />
        <div className='flex justify-end gap-2'>
          {onDone && (
            <Button variant='ghost' size='sm' type='button' onClick={onDone}>
              Cancel
            </Button>
          )}
          <Button
            variant='primary'
            size='sm'
            type='submit'
            disabled={!text.trim()}
            loading={mutation.isPending}
          >
            Post
          </Button>
        </div>
      </div>
    </form>
  )
}
