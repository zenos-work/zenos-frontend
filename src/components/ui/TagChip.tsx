import { Link } from 'react-router-dom'
import type { Tag } from '../../types'

interface Props { tag: Tag; size?: 'sm' | 'md' }

export default function TagChip({ tag, size = 'sm' }: Props) {
  const isOutcome = tag.tag_type === 'outcome'
  return (
    <Link
      to={`/tag/${tag.slug}`}
      className={[
        'inline-block rounded-full transition-colors',
        isOutcome
          ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/45 hover:text-emerald-200'
          : 'bg-gray-800 text-blue-400 hover:bg-gray-700 hover:text-blue-300',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      ].join(' ')}
    >
      {isOutcome ? `Outcome: ${tag.name}` : tag.name}
    </Link>
  )
}
