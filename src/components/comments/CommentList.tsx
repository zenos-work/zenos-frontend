import { useComments } from '../../hooks/useComments'
import { useAuth } from '../../hooks/useAuth'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'
import Spinner     from '../ui/Spinner'

export default function CommentList({ articleId }: { articleId: string }) {
  const { data: comments, isLoading } = useComments(articleId)
  const { user } = useAuth()

  if (isLoading) return <Spinner />

  return (
    <div className='space-y-6'>
      {user && (
        <CommentForm articleId={articleId} />
      )}
      {!comments?.length ? (
        <p className='text-sm text-gray-600 text-center py-6'>
          No comments yet. {user ? 'Be the first!' : 'Sign in to comment.'}
        </p>
      ) : (
        <div className='space-y-6'>
          {comments
            .filter(c => !c.parent_id)
            .map(c => <CommentItem key={c.id} comment={c} articleId={articleId} />)
          }
        </div>
      )}
    </div>
  )
}
