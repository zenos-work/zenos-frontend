import { useState } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { useFollow } from '../../hooks/useSocial'
import { useAuth } from '../../hooks/useAuth'

export default function FollowButton({ authorId }: { authorId: string }) {
  const { user } = useAuth()
  const [following, setFollowing] = useState(false)
  const mutation = useFollow(authorId)

  if (!user || user.id === authorId) return null

  const handle = async () => {
    await mutation.mutateAsync(!following)
    setFollowing(f => !f)
  }

  return (
    <button
      onClick={handle}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
        'border transition-all duration-150',
        following
          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-red-500/40 hover:text-red-400'
          : 'bg-blue-600/20 border-blue-500/40 text-blue-400 hover:bg-blue-600/30',
      ].join(' ')}
    >
      {following
        ? <><UserCheck size={12} /> Following</>
        : <><UserPlus size={12} /> Follow</>
      }
    </button>
  )
}
