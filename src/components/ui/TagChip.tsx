import { Link } from 'react-router-dom'
import type { Tag } from '../../types'

interface Props { tag: Tag; size?: 'sm' | 'md' }

export default function TagChip({ tag, size = 'sm' }: Props) {
  return (
    <Link
      to={`/tag/${tag.slug}`}
      className={[
        'inline-block rounded-full bg-gray-800 text-blue-400',
        'hover:bg-gray-700 hover:text-blue-300 transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      ].join(' ')}
    >
      {tag.name}
    </Link>
  )
}
