import { Clock, Eye, Heart, MessageCircle, Calendar } from 'lucide-react'
import type { ArticleDetail } from '../../types'

export default function ArticleMeta({ article }: { article: ArticleDetail }) {
  return (
    <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500'>
      <span className='flex items-center gap-1.5'>
        <Clock size={14} /> {article.read_time_minutes} min read
      </span>
      <span className='flex items-center gap-1.5'>
        <Eye size={14} /> {article.views_count.toLocaleString()} views
      </span>
      <span className='flex items-center gap-1.5'>
        <Heart size={14} /> {article.likes_count.toLocaleString()} likes
      </span>
      <span className='flex items-center gap-1.5'>
        <MessageCircle size={14} /> {article.comments_count} comments
      </span>
      {article.published_at && (
        <span className='flex items-center gap-1.5'>
          <Calendar size={14} /> {new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      )}
    </div>
  )
}
