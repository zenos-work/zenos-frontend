import { Link } from 'react-router-dom'
import type { ArticleList } from '../../types'
import Avatar  from '../ui/Avatar'
import TagChip from '../ui/TagChip'
import { resolveAssetUrl } from '../../lib/assets'

interface Props { article: ArticleList }

export default function ArticleHero({ article }: Props) {
  const coverUrl = resolveAssetUrl(article.cover_image_url)

  return (
    <Link to={`/article/${article.slug}`} className='group block relative overflow-hidden rounded-2xl aspect-video bg-gray-900'>
      {coverUrl && (
        <img
          src={coverUrl}
          alt=''
          className='absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
          loading='lazy'
        />
      )}
      <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />
      <div className='absolute bottom-0 left-0 right-0 p-5 space-y-2'>
        <div className='flex gap-1.5'>
          {article.tags.slice(0, 2).map(t => <TagChip key={t.id} tag={t} />)}
        </div>
        <h3 className='text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors'>
          {article.title}
        </h3>
        <div className='flex items-center gap-2'>
          <Avatar name={article.author_name ?? '?'} src={article.author_avatar} size='sm' />
          <span className='text-xs text-gray-300'>{article.author_name}</span>
          <span className='text-xs text-gray-500'>· {article.read_time_minutes}m read</span>
        </div>
      </div>
    </Link>
  )
}
