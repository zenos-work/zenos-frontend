import { useToggleReaction } from '../../hooks/useReactions'
import { Brain, Flame, Heart, Lightbulb } from 'lucide-react'
import type { ReactionType } from '../../types/reading'

const REACTIONS: { type: ReactionType; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }[] = [
  { type: 'fire', icon: Flame, label: 'Fire' },
  { type: 'lightbulb', icon: Lightbulb, label: 'Insightful' },
  { type: 'heart', icon: Heart, label: 'Love' },
  { type: 'brain', icon: Brain, label: 'Deep' },
]

interface ConsolidatedReactionsProps {
  articleId: string
  reactions?: Record<ReactionType, { count: number; userReacted: boolean }>
  isLoading?: boolean
}

export function ConsolidatedReactions({
  articleId,
  reactions,
  isLoading,
}: ConsolidatedReactionsProps) {
  const { mutate: toggleReaction } = useToggleReaction(articleId)

  if (isLoading) {
    return (
      <div className='flex gap-2'>
        {REACTIONS.map((reaction) => (
          <div
            key={reaction.type}
            className='h-9 w-16 animate-pulse rounded-lg bg-[color:var(--surface-0)]'
          />
        ))}
      </div>
    )
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {REACTIONS.map((reaction) => {
        const reactionData = reactions?.[reaction.type] || {
          count: 0,
          userReacted: false,
        }
        const isActive = reactionData.userReacted

        return (
          <button
            key={reaction.type}
            onClick={() => toggleReaction({ reactionType: reaction.type })}
            aria-label={reaction.label}
            className={`
              flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm
              border transition-colors duration-150
              ${
                isActive
                  ? 'border-[color:var(--accent)] bg-[color:var(--surface-1)] text-[color:var(--accent)]'
                  : 'border-transparent bg-transparent text-[color:var(--text-muted)] hover:border-[color:var(--border)] hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)]'
              }
            `}
            title={reaction.label}
          >
            <reaction.icon size={16} className='shrink-0' />
            <span className='text-xs font-medium tabular-nums'>{reactionData.count}</span>
          </button>
        )
      })}
    </div>
  )
}
