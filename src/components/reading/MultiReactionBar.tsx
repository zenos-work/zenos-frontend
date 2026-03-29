import { useState } from 'react'
import { useToggleReaction } from '../../hooks/useReactions'
import type { ReactionType } from '../../types/reading'

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'lightbulb', emoji: '💡', label: 'Lightbulb' },
  { type: 'heart', emoji: '❤️', label: 'Heart' },
  { type: 'brain', emoji: '🧠', label: 'Brain' },
]

export function MultiReactionBar({
  articleId,
  reactions,
  isLoading,
}: {
  articleId: string
  reactions?: Record<ReactionType, { count: number; userReacted: boolean }>
  isLoading?: boolean
}) {
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null)
  const { mutate: toggleReaction } = useToggleReaction(articleId)

  if (isLoading) {
    return (
      <div className='flex gap-4'>
        {REACTIONS.map((reaction) => (
          <div key={reaction.type} className='h-10 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700' />
        ))}
      </div>
    )
  }

  return (
    <div className='flex gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800 md:gap-4 md:p-4'>
      {REACTIONS.map((reaction) => {
        const reactionData = reactions?.[reaction.type] || { count: 0, userReacted: false }
        const isActive = reactionData.userReacted

        return (
          <button
            key={reaction.type}
            onClick={() => toggleReaction({ reactionType: reaction.type })}
            className={`relative flex flex-col items-center gap-1 rounded px-2 py-1 transition md:flex-row md:gap-2 md:px-3 md:py-2 ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-900/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onMouseEnter={() => setHoveredReaction(reaction.type)}
            onMouseLeave={() => setHoveredReaction(null)}
            title={reaction.label}
          >
            <span className='text-xl md:text-2xl'>{reaction.emoji}</span>
            <span className={`text-xs font-medium md:text-sm ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {reactionData.count > 0 ? reactionData.count : '-'}
            </span>

            {hoveredReaction === reaction.type && (
              <div className='absolute bottom-12 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap'>
                {reaction.label}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
