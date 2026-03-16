import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useLike } from '../../hooks/useSocial'
import { useAuth } from '../../hooks/useAuth'
import { useUiStore } from '../../stores/uiStore'
import { useNavigate } from 'react-router-dom'

interface Props { articleId: string; count: number }

export default function LikeButton({ articleId, count }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast    = useUiStore(s => s.toast)
  const [liked, setLiked] = useState(false)
  const mutation = useLike(articleId)

  const handle = async () => {
    if (!user) { navigate('/login'); return }
    try {
      await mutation.mutateAsync(!liked)
      setLiked(l => !l)
    } catch {
      toast('Could not update like', 'error')
    }
  }

  return (
    <button
      onClick={handle}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm',
        'border transition-all duration-150',
        liked
          ? 'bg-red-900/30 border-red-500/40 text-red-400'
          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-red-500/40 hover:text-red-400',
      ].join(' ')}
    >
      <Heart size={14} className={liked ? 'fill-current' : ''} />
      <span>{count + (liked ? 1 : 0)}</span>
    </button>
  )
}
