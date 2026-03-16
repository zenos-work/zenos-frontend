import { useParams, Link } from 'react-router-dom'
import { useArticle } from '../hooks/useArticles'
import { useAuth } from '../hooks/useAuth'
import ArticleDetail from '../components/article/ArticleDetail'
import ArticleMeta   from '../components/article/ArticleMeta'
import CommentList   from '../components/comments/CommentList'
import LikeButton    from '../components/social/LikeButton'
import BookmarkButton from '../components/social/BookmarkButton'
import FollowButton  from '../components/social/FollowButton'
import TagChip       from '../components/ui/TagChip'
import Avatar        from '../components/ui/Avatar'
import Spinner       from '../components/ui/Spinner'
import { PenSquare } from 'lucide-react'

export default function ArticlePage() {
  const { slug }  = useParams()
  const { user }  = useAuth()
  const { data: article, isLoading, error } = useArticle(slug ?? '')

  if (isLoading) return <div className='flex justify-center py-20'><Spinner size='lg' /></div>
  if (error || !article) return (
    <div className='text-center py-20'>
      <p className='text-gray-400 mb-4'>Article not found</p>
      <Link to='/' className='text-blue-400 hover:underline'>← Back to home</Link>
    </div>
  )

  const isOwner = user?.id === article.author_id

  return (
    <article className='max-w-2xl mx-auto space-y-8'>

      {/* Cover image */}
      {article.cover_image_url && (
        <img src={article.cover_image_url} alt=''
          className='w-full h-72 object-cover rounded-2xl' />
      )}

      {/* Tags */}
      {article.tags?.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {article.tags.map(tag => <TagChip key={tag.id} tag={tag} size='md' />)}
        </div>
      )}

      {/* Title */}
      <header className='space-y-3'>
        <h1 className='text-3xl font-bold text-white leading-tight'>{article.title}</h1>
        {article.subtitle && (
          <p className='text-xl text-gray-400 leading-relaxed'>{article.subtitle}</p>
        )}
      </header>

      {/* Author + actions bar */}
      <div className='flex items-center justify-between py-4 border-y border-gray-800'>
        <div className='flex items-center gap-3'>
          <Avatar name={article.author_name ?? '?'} src={article.author_avatar} size='md' />
          <div>
            <div className='flex items-center gap-2'>
              <Link to={`/profile/${article.author_id}`}
                className='text-sm font-medium text-white hover:text-blue-400 transition-colors'>
                {article.author_name}
              </Link>
              {!isOwner && <FollowButton authorId={article.author_id} />}
            </div>
            <ArticleMeta article={article} />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {isOwner && article.status !== 'PUBLISHED' && (
            <Link to={`/write/${article.id}`}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-gray-700 text-gray-400 hover:text-white transition-colors'>
              <PenSquare size={13} /> Edit
            </Link>
          )}
          <LikeButton articleId={article.id} count={article.likes_count} />
          <BookmarkButton articleId={article.id} />
        </div>
      </div>

      {/* Rejection note for author */}
      {article.rejection_note && isOwner && (
        <div className='p-4 rounded-xl border border-red-500/30 bg-red-900/10'>
          <p className='text-sm font-medium text-red-400 mb-1'>Rejection note</p>
          <p className='text-sm text-gray-300'>{article.rejection_note}</p>
        </div>
      )}

      {/* Content */}
      <ArticleDetail content={article.content} />

      {/* Comments */}
      <section className='pt-8 border-t border-gray-800'>
        <h2 className='text-lg font-semibold text-white mb-6'>
          {article.comments_count} {article.comments_count === 1 ? 'Comment' : 'Comments'}
        </h2>
        <CommentList articleId={article.id} />
      </section>
    </article>
  )
}
