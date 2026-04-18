import { useState } from 'react'
import { useParams } from 'react-router-dom'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import { useCommunitySpace, useCreatePost, useJoinSpace, useLikePost, useSpaceMembers, useSpacePosts, usePostReplies, type CommunityPost } from '../hooks/useCommunity'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useUiStore } from '../stores/uiStore'

const POST_TYPE_BADGES: Record<string, { label: string; color: string }> = {
  discussion:   { label: 'Discussion',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  announcement: { label: 'Announcement', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  event:        { label: 'Event',        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  question:     { label: 'Question',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
}

type PostCardProps = {
  post: CommunityPost
  spaceId: string
  enabled: boolean
  onLike: (id: string) => void
}

function PostCard({ post, spaceId, enabled, onLike }: PostCardProps) {
  const toast = useUiStore((s) => s.toast)
  const [showReplies, setShowReplies] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const createReply = useCreatePost(spaceId)
  const replies = usePostReplies(spaceId, post.id, enabled && showReplies)

  const badge = POST_TYPE_BADGES[post.post_type ?? 'discussion'] ?? POST_TYPE_BADGES.discussion

  const handleReply = async () => {
    if (!replyBody.trim()) return
    try {
      await createReply.mutateAsync({ title: '', body: replyBody.trim(), parent_id: post.id })
      setReplyBody('')
      toast('Reply posted', 'success')
    } catch {
      toast('Could not post reply', 'error')
    }
  }

  return (
    <article className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
      <div className='flex items-start gap-2'>
        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.color}`}>
          {badge.label}
        </span>
        <h3 className='flex-1 text-sm font-semibold text-[color:var(--text-primary)]'>{post.title}</h3>
      </div>
      <p className='mt-2 text-sm text-[color:var(--text-secondary)] whitespace-pre-wrap'>{post.body}</p>
      <div className='mt-3 flex items-center gap-4'>
        <button
          type='button'
          className='text-xs font-semibold text-[color:var(--accent)] hover:underline'
          onClick={() => onLike(post.id)}
        >
          Like {post.like_count ? `(${post.like_count})` : ''}
        </button>
        <button
          type='button'
          className='text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
          onClick={() => setShowReplies((v) => !v)}
        >
          {showReplies ? 'Hide' : 'Reply'}
        </button>
      </div>

      {showReplies && (
        <div className='mt-3 space-y-2 border-t border-[color:var(--border)] pt-3'>
          {replies.isLoading ? (
            <Spinner />
          ) : (replies.data?.replies ?? []).length === 0 ? (
            <p className='text-xs text-[color:var(--text-muted)]'>No replies yet — be the first!</p>
          ) : (
            (replies.data?.replies ?? []).map((reply) => (
              <div key={reply.id} className='rounded-lg bg-[color:var(--surface-0)] px-3 py-2'>
                <p className='text-xs text-[color:var(--text-secondary)] whitespace-pre-wrap'>{reply.body}</p>
              </div>
            ))
          )}
          <div className='mt-2 flex gap-2'>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder='Write a reply…'
              rows={2}
              className='flex-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-xs'
            />
            <button
              type='button'
              onClick={() => void handleReply()}
              disabled={createReply.isPending || !replyBody.trim()}
              className='self-end rounded-full bg-[color:var(--accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60'
            >
              {createReply.isPending ? '…' : 'Reply'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default function SpacePage() {
  const { id = '' } = useParams()
  const toast = useUiStore((s) => s.toast)
  const { enabled, isLoading: flagLoading } = useFeatureFlag('community')
  const space = useCommunitySpace(id, enabled)
  const posts = useSpacePosts(id, enabled)
  const members = useSpaceMembers(id, enabled)
  const join = useJoinSpace(id)
  const createPost = useCreatePost(id)
  const likePost = useLikePost(id)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [postType, setPostType] = useState<string>('discussion')

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) {
    return <FeatureComingSoon name='Space view' description='Community space interactions are behind the community feature flag.' />
  }

  if (space.isLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!space.data) return <FeatureComingSoon name='Space unavailable' description='The selected space could not be loaded.' />

  return (
    <div className='space-y-6'>
      <header className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5'>
        <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>{space.data.name}</h1>
        <p className='mt-2 text-sm text-[color:var(--text-secondary)]'>{space.data.description ?? 'No description yet.'}</p>
        <button
          type='button'
          className='mt-4 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white'
          onClick={() => {
            void join
              .mutateAsync()
              .then(() => toast('Joined space', 'success'))
              .catch(() => toast('Could not join space', 'error'))
          }}
        >
          Join space
        </button>
      </header>

      <section className='grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]'>
        <div className='space-y-4'>
          <article className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
            <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Create post</h2>
            <div className='mt-3 flex gap-2 flex-wrap'>
              {Object.keys(POST_TYPE_BADGES).map((type) => (
                <button
                  key={type}
                  type='button'
                  onClick={() => setPostType(type)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    postType === type
                      ? POST_TYPE_BADGES[type].color + ' ring-1 ring-current'
                      : 'border border-[color:var(--border)] text-[color:var(--text-muted)] hover:bg-[color:var(--surface-2)]'
                  }`}
                >
                  {POST_TYPE_BADGES[type].label}
                </button>
              ))}
            </div>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder='Post title' className='mt-3 h-10 w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm' />
            <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder='Share your update' className='mt-3 min-h-24 w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] p-3 text-sm' />
            <button
              type='button'
              className='mt-3 rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold disabled:opacity-60'
              disabled={createPost.isPending}
              onClick={() => {
                if (!title.trim() || !body.trim()) return
                void createPost
                  .mutateAsync({ title: title.trim(), body: body.trim(), post_type: postType })
                  .then(() => {
                    setTitle('')
                    setBody('')
                    toast('Post published', 'success')
                  })
                  .catch(() => toast('Could not publish post', 'error'))
              }}
            >
              {createPost.isPending ? 'Publishing…' : 'Publish post'}
            </button>
          </article>

          {posts.isLoading ? (
            <div className='flex justify-center py-8'><Spinner /></div>
          ) : (posts.data?.posts ?? []).length === 0 ? (
            <p className='text-center text-sm text-[color:var(--text-muted)] py-8'>No posts yet. Start the conversation!</p>
          ) : (
            (posts.data?.posts ?? []).map((post) => (
              <PostCard
                key={post.id}
                post={post}
                spaceId={id}
                enabled={enabled}
                onLike={(postId) => {
                  void likePost
                    .mutateAsync(postId)
                    .then(() => toast('Post liked', 'success'))
                    .catch(() => toast('Could not like post', 'error'))
                }}
              />
            ))
          )}
        </div>

        <aside className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
          <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Members</h2>
          <ul className='mt-3 space-y-2'>
            {(members.data?.members ?? []).map((member) => (
              <li key={member.user_id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)]'>
                {member.user_id} <span className='text-[color:var(--text-secondary)]'>({member.org_role})</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  )
}
