import { Link } from 'react-router-dom'
import { Eye, Heart, MessageCircle, Clock } from 'lucide-react'
import type { ArticleList } from '../../types'
import Avatar  from '../ui/Avatar'
import TagChip from '../ui/TagChip'
import Badge   from '../ui/Badge'

const STATUS_VARIANT: Record<string, any> = {
  DRAFT:     'default',
  SUBMITTED: 'warning',
  APPROVED:  'info',
  REJECTED:  'danger',
  PUBLISHED: 'success',
  ARCHIVED:  'default',
}

interface Props {
  article:    ArticleList
  showStatus?: boolean  // for library view
}

export default function ArticleCard({ article, showStatus }: Props) {
  return (
    <article className='group flex gap-4 p-4 rounded-xl bg-gray-900 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 transition-all duration-200'>
      {/* Cover thumbnail */}
      {article.cover_image_url && (
        <img
          src={article.cover_image_url}
          alt=''
          className='w-28 h-20 object-cover rounded-lg shrink-0'
          loading='lazy'
        />
      )}

      <div className='flex-1 min-w-0 space-y-2'>
        {/* Author row */}
        <div className='flex items-center gap-2'>
          <Avatar name={article.author_name ?? '?'} src={article.author_avatar} size='sm' />
          <span className='text-xs text-gray-400 truncate'>{article.author_name}</span>
          {showStatus && (
            <Badge variant={STATUS_VARIANT[article.status] ?? 'default'}>
              {article.status}
            </Badge>
          )}
        </div>

        {/* Title */}
        <Link
          to={`/article/${article.slug}`}
          className='block font-semibold text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-2'
        >
          {article.title}
        </Link>

        {/* Subtitle */}
        {article.subtitle && (
          <p className='text-sm text-gray-500 line-clamp-1'>{article.subtitle}</p>
        )}

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className='flex flex-wrap gap-1'>
            {article.tags.slice(0, 3).map(t => <TagChip key={t.id} tag={t} />)}
          </div>
        )}

        {/* Stats row */}
        <div className='flex items-center gap-4 text-xs text-gray-600'>
          <span className='flex items-center gap-1'>
            <Clock size={11} /> {article.read_time_minutes}m
          </span>
          <span className='flex items-center gap-1'>
            <Eye size={11} /> {article.views_count.toLocaleString()}
          </span>
          <span className='flex items-center gap-1'>
            <Heart size={11} /> {article.likes_count.toLocaleString()}
          </span>
          <span className='flex items-center gap-1'>
            <MessageCircle size={11} /> {article.comments_count}
          </span>
          {article.published_at && (
            <span className='ml-auto'>
              {new Date(article.published_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
